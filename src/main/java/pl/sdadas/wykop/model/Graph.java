package pl.sdadas.wykop.model;

import org.apache.commons.lang3.ObjectUtils;
import org.apache.commons.lang3.tuple.ImmutablePair;
import org.apache.commons.lang3.tuple.Pair;

import java.io.Serializable;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * @author Sławomir Dadas
 */
public class Graph implements Serializable {

    private static final long serialVersionUID = -5130958307358906687L;

    private Map<String, GraphNode> nodes = new HashMap<>();

    private Map<Pair<String, String>, Double> connections;

    public void addNode(GraphNode node) {
        this.nodes.put(node.name(), node);
    }

    public GraphNode getNode(String name) {
        return this.nodes.get(name);
    }

    public void buildConnections() {
        this.connections = new HashMap<>();
        Set<GraphNode> values = new HashSet<>(nodes.values());
        for (GraphNode node : values) {
            node.outlinks().forEach((name, weight) -> createConnection(node, name, weight));
        }
    }

    private void createConnection(GraphNode node, String target, int weight) {
        Pair<String, String> key = key(node.name(), target);
        if(this.connections.containsKey(key)) {
            return;
        }
        GraphNode otherNode = nodes.get(target);
        if(otherNode == null) {
            otherNode = new GraphNode(target, weight);
            addNode(otherNode);
        }
        int reverseWeight = otherNode.outlinks().getOrDefault(node.name(), 0);
        double linkp = Math.max(weight, reverseWeight);
        double allp = Math.max(node.outsum(), otherNode.outsum());
        connections.put(key, linkp / allp);
    }

    private Pair<String, String> key(String name1, String name2) {
        String from = ObjectUtils.min(name1, name2);
        String to = ObjectUtils.max(name1, name2);
        return ImmutablePair.of(from, to);
    }

    public Map<String, GraphNode> nodes() {
        return nodes;
    }

    public Map<Pair<String, String>, Double> connections() {
        return connections;
    }
}
