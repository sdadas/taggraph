package pl.sdadas.wykop.tools;

import it.uniroma1.dis.wsngroup.gexf4j.core.*;
import it.uniroma1.dis.wsngroup.gexf4j.core.impl.EdgeImpl;
import it.uniroma1.dis.wsngroup.gexf4j.core.impl.GexfImpl;
import it.uniroma1.dis.wsngroup.gexf4j.core.impl.StaxGraphWriter;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.tuple.Pair;
import pl.sdadas.wykop.model.Graph;
import pl.sdadas.wykop.model.GraphNode;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.Date;
import java.util.Map;

/**
 * @author Sławomir Dadas
 */
public final class GexfExporter {

    private final Graph input;

    public static void export(Graph input, File output) {
        GexfExporter exporter = new GexfExporter(input);
        exporter.export(output);
    }

    private GexfExporter(Graph input) {
        this.input = input;
    }

    private void export(File output) {
        Gexf gexf = new GexfImpl();
        gexf.getMetadata().setLastModified(new Date()).setCreator("taggraph");
        gexf.setVisualization(true);

        it.uniroma1.dis.wsngroup.gexf4j.core.Graph graph = gexf.getGraph();
        graph.setDefaultEdgeType(EdgeType.UNDIRECTED).setMode(Mode.STATIC).setIDType(IDType.STRING);
        createNodes(graph);
        createEdges(graph);
        writeGraph(gexf, output);
    }

    private void createNodes(it.uniroma1.dis.wsngroup.gexf4j.core.Graph graph) {
        Collection<GraphNode> nodes = input.nodes().values();
        for (GraphNode node : nodes) {
            if(StringUtils.isBlank(node.name())) continue;
            Node result = graph.createNode(node.name());
            result.setLabel(node.name());
            double size = Math.max(Math.log(node.weight()), 1.0);
            result.setSize((float)size);
        }
    }

    private void createEdges(it.uniroma1.dis.wsngroup.gexf4j.core.Graph graph) {
        Map<Pair<String, String>, Double> connections = input.connections();
        for (Map.Entry<Pair<String, String>, Double> entry : connections.entrySet()) {
            Pair<String, String> key = entry.getKey();
            if(StringUtils.isBlank(key.getLeft()) || StringUtils.isBlank(key.getRight())) {
                continue;
            }
            Node first = graph.getNode(key.getLeft());
            Node second = graph.getNode(key.getRight());
            Edge result = first.connectTo(second);
            result.setWeight(entry.getValue().floatValue());
        }
    }

    private void writeGraph(Gexf gexf, File output) {
        StaxGraphWriter writer = new StaxGraphWriter();
        try(Writer out = new FileWriter(output, false)) {
            writer.writeToStream(gexf, out, StandardCharsets.UTF_8.name());
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
