interface Sigma {
    parsers: any;
    graph: any;
    camera: any;
    refresh: Function;
    bind: Function;
}

declare var sigma: Sigma;
declare var $: any;

class Application {

    private search: HTMLInputElement;
    private headerCheckbox: HTMLInputElement;
    private suggester: Suggester;
    private maxhits: number = 10;
    private sigma: Sigma;

    constructor() {
        this.suggester = new EmptySuggester();
        this.search = <HTMLInputElement>document.getElementById('search_tag');
        this.headerCheckbox = <HTMLInputElement>document.getElementById('header_checkbox');
    }

    draw(): void {
        const options: any = {
            renderer: {
                container: document.getElementById('container'),
                type: 'webgl'
            },
            settings: {
                defaultLabelColor: '#aaa',
                defaultLabelSize: 14,
                labelThreshold: 8,
                labelSize: "proportional",
                labelSizeRatio: 1.5,
                font: "Consolas",
                zoomMin: 0.01,
                zoomMax: 2,
                hideEdgesOnMove: true,
                maxNodeSize: 10,
                webglOversamplingRatio: 2
            }
        };
        sigma.parsers.json("demo/data.json", options, (sigma: Sigma) => this.onGraphRendered(sigma))
    }

    onGraphRendered(sigma: Sigma): void {
        this.sigma = sigma;
        let names: string[] = [];
        sigma.graph.nodes().forEach((node) => names.push(node.id));
        names.sort();
        this.suggester = new ListSuggester(names, this.maxhits);
        $(this.search).typeahead({highlight: true},
            {
                source: (query: string, cb: any) => {
                    let matches:string[] = this.suggester.suggest(query);
                    cb(matches);
                },
                limit: this.maxhits
            }
        );
        $(this.search).on("keypress", (event: any) => {
            if (event.keyCode == 13) {
                event.preventDefault();
                this.onSearch(this.search.value);
            }
        });
        $(this.search).bind('typeahead:select', () => this.onSearch(this.search.value));
        $(this.headerCheckbox).on("change", (event: any) => {
            let container: any = $("#container");
            if(this.headerCheckbox.checked) {
                container.hide();
            } else {
                container.show();
            }
        });
        this.sigma.bind("doubleClickNode", (event: any) => {
            window.location.href = "https://www.wykop.pl/tag/" + event.data.node.id
        });
    }

    onSearch(tag: string) {
        let nodes: any[] = this.sigma.graph.nodes().filter((el: any) => el.id === tag);
        if(nodes.length === 0) return;
        let node: any = nodes[0];
        const ratio: number = Math.min(node.size, 20) / 400.0;
        this.sigma.camera.goTo({x: node["read_cam0:x"], y: node["read_cam0:y"], ratio: ratio});
    }
}

interface Suggester {
    suggest(prefix: string): string[];
}

class EmptySuggester implements Suggester {
    suggest(prefix:string):string[] {
        return [];
    }
}

enum InputMatch {
    LT, GT, EQ, SUBSTRING, SUPERSTRING
}

class ListSuggester implements Suggester {

    private data: string[];
    private cached: string[];
    private hits: number;

    constructor(data: string[], hits: number) {
        this.data = data;
        this.cached = new Array<string>(data.length);
        this.hits = hits;
    }

    suggest(prefix:string):string[] {
        let query: string = this.normalize(prefix);
        if(!query) return [];
        let idx: number = this.search(query);
        if(idx === -1) return [];
        return this.collect(query, idx);
    }

    private collect(input: string, startIdx: number): string[] {
        let res: string[] = [];
        let i: number = startIdx;
        while(i < this.data.length && res.length < this.hits) {
            let im: InputMatch = this.matches(input, i);
            if(im === InputMatch.EQ || im === InputMatch.SUBSTRING) {
                res.push(this.data[i]);
            } else {
                break;
            }
            i++;
        }
        return res;
    }

    private normalize(input: string): string {
        return input.toLowerCase().trim();
    }

    private at(idx: number): string {
        let res = this.cached[idx];
        if(!res) {
            res = this.normalize(this.data[idx]);
            this.cached[idx] = res;
        }
        return res;
    }

    private matches(input: string, idx: number): InputMatch {
        let target: string = this.at(idx);
        return this.compare(input, target);
    }

    private compare(input: string, target: string): InputMatch {
        let inputSize = input.length;
        let targetSize = target.length;
        for(let i=0; i < Math.min(inputSize, targetSize); ++i) {
            let c1 = input[i];
            let c2 = target[i];
            if(c1 !== c2) {
                if(c1 < c2) return InputMatch.LT;
                else return InputMatch.GT;
            }
        }

        if(inputSize === targetSize) return InputMatch.EQ;
        if(inputSize < targetSize) return InputMatch.SUBSTRING;
        return InputMatch.SUPERSTRING;
    }

    private search(input: string): number {
        let m: number = 0;
        let n: number = this.data.length - 1;
        let lastMatch = -1;
        let lastSuperString = -1;
        while (m <= n) {
            let k = (n + m) >> 1;
            let cmp: InputMatch = this.matches(input, k);
            switch (cmp) {
                case InputMatch.GT: m = k + 1; break;
                case InputMatch.LT: n = k - 1; break;
                case InputMatch.SUBSTRING: lastMatch = k; n = k - 1; break;
                case InputMatch.SUPERSTRING: lastSuperString = k; m = k + 1; break;
                case InputMatch.EQ: return k;
            }
        }
        if(lastMatch !== -1) return lastMatch;
        return -1;
    }

}

new Application().draw();