package pl.sdadas.wykop;

import pl.sdadas.wykop.model.Graph;
import pl.sdadas.wykop.tools.GexfExporter;
import pl.sdadas.wykop.tools.GraphBuilder;

import java.io.File;
import java.io.IOException;

/**
 * @author Sławomir Dadas
 */
public class Application {

    public static void main(String [] args) throws IOException {
        Graph graph = GraphBuilder.build();
        File gexf = new File("graph.gexf");
        GexfExporter.export(graph, gexf);
    }
}
