from typing import Dict, List, Tuple, Union

# Sample code taken from aima-python

class BayesNode:
    def __init__(self, X: str, parents: List[str], cpt: Dict[Union[tuple, str], float]):
        if isinstance(parents, str):
            parents = parents.split()
        if(isinstance(list(cpt.keys())[0], str)):
            cpt = { (k,): v for (k, v) in cpt.items() }
        self.variable: str = X
        self.parents: List[str] = parents
        self.cpt: Dict[tuple, float] = cpt
        self.values: List[str] = list(set([k[0] for k in cpt.keys()]))


class BayesNet:
    def __init__(self, node_specs: List[Tuple[str, str, Dict[Union[tuple, str], float]]]):
        self.nodes: list[BayesNode] = []
        self.variables: list[str] = []
        node_specs = node_specs or []
        for node_spec in node_specs:
          node = BayesNode(*node_spec)
          self.nodes.append(node)
          self.variables.append(node.variable)