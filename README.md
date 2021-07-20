# Bayesian Networks Parser
A parser for bayesian networks in `.net` format. It generates Python code for instantiating BNs with discrete variables, compatible with an extension of BNs implemented in aima-python.

## Usage
Input:
```bash
tsc
node dist/main.js < nets/asia.net > asiaNet.py
```
Ouptut:
```
from BNetwork import BayesNet
bn = BayesNet([
  ('smoke', '', ({
    ('yes'): 0.5,
    ('no'): 0.5
  })),
  ('bronc', 'smoke', ({
    ('yes','yes'): 0.6,
    ('no','yes'): 0.4,
    ('yes','no'): 0.3,
    ('no','no'): 0.7
  })),
  ('lung', 'smoke', ({
    ('yes','yes'): 0.1,
    ('no','yes'): 0.9,
    ('yes','no'): 0.01,
    ('no','no'): 0.99
  })),
  ('asia', '', ({
    ('yes'): 0.01,
    ('no'): 0.99
  })),
  ('tub', 'asia', ({
    ('yes','yes'): 0.05,
    ('no','yes'): 0.95,
    ('yes','no'): 0.01,
    ('no','no'): 0.99
  })),
  ('either', 'lung tub', ({
    ('yes','yes','yes'): 1,
    ('no','yes','yes'): 0,
    ('yes','no','yes'): 1,
    ('no','no','yes'): 0,
    ('yes','yes','no'): 1,
    ('no','yes','no'): 0,
    ('yes','no','no'): 0,
    ('no','no','no'): 1
  })),
  ('xray', 'either', ({
    ('yes','yes'): 0.98,
    ('no','yes'): 0.02,
    ('yes','no'): 0.05,
    ('no','no'): 0.95
  })),
  ('dysp', 'bronc either', ({
    ('yes','yes','yes'): 0.9,
    ('no','yes','yes'): 0.1,
    ('yes','no','yes'): 0.8,
    ('no','no','yes'): 0.2,
    ('yes','yes','no'): 0.7,
    ('no','yes','no'): 0.3,
    ('yes','no','no'): 0.1,
    ('no','no','no'): 0.9
  }))])
```