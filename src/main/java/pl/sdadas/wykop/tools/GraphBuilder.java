package pl.sdadas.wykop.tools;

import org.apache.commons.lang3.StringUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import pl.sdadas.wykop.model.Graph;
import pl.sdadas.wykop.model.GraphNode;

import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * @author Sławomir Dadas
 */
public final class GraphBuilder {

    private final static String TAGS_START = "https://www.wykop.pl/tagi/";
    private final static Pattern TAG_PATTERN = Pattern.compile("#(\\w*)\\s+\\((\\d+k?)\\)", Pattern.UNICODE_CASE);
    private final static int TIMEOUT_DEFAULT = 100000;

    public static Graph build() throws IOException {
        return new GraphBuilder().createGraph();
    }

    private GraphBuilder() {
    }

    private Graph createGraph() throws IOException {
        Document doc = Jsoup.connect(TAGS_START).timeout(TIMEOUT_DEFAULT).get();
        Elements elements = doc.select("div.rbl-block a.tag");
        Graph result = new Graph();
        int idx = 1;
        for (Element element : elements) {
            GraphNode node = createNode(element);
            createLinks(element, node);
            System.out.println(idx + ". " + node.name());
            result.addNode(node);
            idx++;
        }
        result.buildConnections();
        return result;
    }

    private GraphNode createNode(Element element) {
        String tag = StringUtils.lowerCase(StringUtils.strip(element.text()));
        Matcher matcher = TAG_PATTERN.matcher(tag);
        if(matcher.matches()) {
            String name = matcher.group(1);
            int weight = Integer.parseInt(matcher.group(2).replace("k", "000"));
            return new GraphNode(name, weight);
        } else {
            throw new IllegalStateException("Cannot parse tag " + tag);
        }
    }

    private void createLinks(Element element, GraphNode node) throws IOException {
        String href = element.absUrl("href");
        Document doc = downloadRetry(href, 3);
        Element related = doc.select("h4:contains(Powiązane)").first();
        if(related == null) return;
        Elements links = related.nextElementSibling().select("a.tag");
        for (Element link : links) {
            GraphNode relatedNode = createNode(link);
            node.addLink(relatedNode.name(), relatedNode.weight());
        }
    }

    private Document downloadRetry(String url, int times) {
        Document doc = null;
        int count = 0;
        IOException lastError = null;
        while(doc == null && count < times) {
            try {
                count++;
                doc = Jsoup.connect(url).timeout(TIMEOUT_DEFAULT).get();
            } catch (IOException ex) {
                lastError = ex;
            }
        }
        if(doc == null && lastError != null) {
            throw new IllegalStateException(lastError);
        }
        return doc;
    }
}
