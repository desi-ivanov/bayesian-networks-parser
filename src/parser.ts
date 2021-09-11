
type CPT = {
  key: string;
  parents: string[];
  cpt: number[];
  combinations: string[][];
}
type Parsed = {
  nodesMap: Record<string, { name: string, label: string, states: string[] }>
  cpts: CPT[]
}

function parse(rawNet: string): Parsed {
  const nodes = rawNet
    .match(/node(.|\t|\s|\r|\n)+?\}/g)!
    .map(n => n.replace(/\t|\r/g, "").split("\n"))
    .map(v => {
      const name = v[0].split(" ")[1];
      const label = v.find(r => r.includes("label"))?.match(/"(\s|.|\t)+?"/)?.[0].replace(/"/g, "").replace(/\s|\t/g, "_");
      return ({
        name: name
        , label: label ? `${label}_(${name})` : name
        , states: v.find(r => r.includes("states"))?.match(/".+?"/g)?.map(x => x.replace(/"/g, ""))!
      })
    })

  const nodesMap = Object.fromEntries(nodes.map(n => [n.name, n]));
  const cpts = rawNet
    .match(/potential(.|\t|\s|\r|\n)+?\}/g)!
    .map(v => {
      const rows = v.replace(/\t|\r/g, "").split("\n");
      const [key, ...parents] = rows[0]
        .split(/\s|\(|\)/)
        .filter(x => x.length > 0)
        .slice(1).filter(x => !["(", "|", " ", ")"].includes(x));
      parents.reverse()
      const cptRaw = v.substring(v.indexOf("data ="), v.indexOf(";"));
      const cpt = cptRaw
        .replace(/\%(.|\t|\s)+?\n/g, "\n")
        .match(/\((\d|\.|\s|\t|-|E|e|\+)+\)/g)!
        .flatMap(r => r.replace(/\(|\)/g, "").split(/\s|\t/))
        .filter(x => x.length > 0 && !["(", ")"].includes(x))
        .map(x => parseFloat(x))
      return {
        key,
        parents,
        cpt,
        cptRaw,
        combinations: [key, ...parents].map(k => nodesMap[k].states)
          .reverse()
          .reduce((a, vs) => a.flatMap(x => vs.map(z => [...x, z])), [[]] as string[][])
          .map((x) => { x.reverse(); return x })
      }
    });
  const someBroke = cpts.find(c => c.cpt.some(v => v === undefined
    || isNaN(v)
    || c.combinations.length !== c.cpt.length
  ));
  if(someBroke) {
    console.error("Something went wrong. Please check parser", someBroke.key);
    console.error(someBroke);
    console.error(someBroke.combinations.length, someBroke.cpt.length)
    console.error(someBroke.cptRaw)
    console.error(nodesMap[someBroke.key].states, someBroke.parents.map(p => nodesMap[p].states))
    throw new Error("Invalid cpt values");
  }
  return {
    nodesMap,
    cpts
  }
}
function toPythonBayesNet(cpts: CPT[], nodesMap: Parsed["nodesMap"]) {
  return `from BNetwork import BayesNet
bn = BayesNet([
${cpts.map(c => `  ('${nodesMap[c.key].label.replace(/\s|\t/g, "")}', '${c.parents.map(k => nodesMap[k].label.replace(/\s|\t/g, "")).join(" ")}', ({
${c.combinations.map((ks, i) => `    (${ks.map(k => `'${k}'`).join(",")}): ${c.cpt[i]}`).join(",\n")}
  }))`).join(",\n")
    }])`
}

function topologicalSort(parents: Record<string, string[]>): string[] {
  // invert edges
  const children: Record<string, string[]> = Object.entries(parents)
    .reduce((a, [k, edges]) => ({
      ...a
      , ...(Object.fromEntries(edges.map(edge => [edge, [k, ...a[edge]]])))
    }), Object.fromEntries(Object.keys(parents).map(k => [k, []])) as Record<string, string[]>);

  const order: string[] = []
  const permanent = new Set<string>();
  const temporary = new Set<string>();
  const unmarked = new Set<string>(Object.keys(children));

  function visit(n: string) {
    if(permanent.has(n)) {
      return;
    } else if(temporary.has(n)) {
      throw new Error("Grafo ciclico")
    }
    unmarked.delete(n);
    temporary.add(n);
    (children[n] ?? []).forEach(visit);
    temporary.delete(n);
    permanent.add(n);
    order.push(n);
  }

  while(unmarked.size > 0) {
    const fst = unmarked.keys().next().value;
    visit(fst);
  }

  return order.reverse();
}

export function convert(net: string) {
  const { cpts, nodesMap } = parse(net);
  const order = topologicalSort(Object.fromEntries(cpts.map(c => [c.key, c.parents])));
  const cptsMap = Object.fromEntries(cpts.map((v) => [v.key, v]));
  const orderedCpts = order.map(k => cptsMap[k]);
  return toPythonBayesNet(orderedCpts, nodesMap);
}
