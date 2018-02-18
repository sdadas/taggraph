package pl.sdadas.wykop.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * @author Sławomir Dadas
 */
public class GraphNode implements Serializable {

    private String name;

    private int weight;

    private Map<String, Integer> outlinks = new HashMap<>();

    private int outsum = 0;

    public GraphNode(String name, int weight) {
        this.name = name;
        this.weight = weight;
    }

    public String name() {
        return name;
    }

    public int weight() {
        return weight;
    }

    public void addLink(String to, int linkWeight) {
        this.outlinks.put(to, linkWeight);
        this.outsum += linkWeight;
    }

    public Map<String, Integer> outlinks() {
        return this.outlinks;
    }

    public int outsum() {
        return this.outsum;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        GraphNode graphNode = (GraphNode) o;
        return Objects.equals(name, graphNode.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
