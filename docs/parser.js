"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convert = void 0;
function parse(rawNet) {
    var nodes = rawNet
        .match(/node(.|\t|\s|\r|\n)+?\}/g)
        .map(function (n) { return n.replace(/\t|\r/g, "").split("\n"); })
        .map(function (v) {
        var _a, _b, _c, _d;
        var name = v[0].split(" ")[1];
        var label = (_b = (_a = v.find(function (r) { return r.includes("label"); })) === null || _a === void 0 ? void 0 : _a.match(/"(\s|.|\t)+?"/)) === null || _b === void 0 ? void 0 : _b[0].replace(/"/g, "").replace(/\s|\t/g, "_");
        return ({
            name: name,
            label: label ? label + "_(" + name + ")" : name,
            states: (_d = (_c = v.find(function (r) { return r.includes("states"); })) === null || _c === void 0 ? void 0 : _c.match(/".+?"/g)) === null || _d === void 0 ? void 0 : _d.map(function (x) { return x.replace(/"/g, ""); })
        });
    });
    var nodesMap = Object.fromEntries(nodes.map(function (n) { return [n.name, n]; }));
    var cpts = rawNet
        .match(/potential(.|\t|\s|\r|\n)+?\}/g)
        .map(function (v) {
        var rows = v.replace(/\t|\r/g, "").split("\n");
        var _a = rows[0]
            .split(/\s|\(|\)/)
            .filter(function (x) { return x.length > 0; })
            .slice(1).filter(function (x) { return !["(", "|", " ", ")"].includes(x); }), key = _a[0], parents = _a.slice(1);
        parents.reverse();
        var cptRaw = v.substring(v.indexOf("data ="), v.indexOf(";"));
        var cpt = cptRaw
            .replace(/\%(.|\t|\s)+?\n/g, "\n")
            .match(/\((\d|\.|\s|\t|-|E|e|\+)+\)/g)
            .flatMap(function (r) { return r.replace(/\(|\)/g, "").split(/\s|\t/); })
            .filter(function (x) { return x.length > 0 && !["(", ")"].includes(x); })
            .map(function (x) { return parseFloat(x); });
        return {
            key: key,
            parents: parents,
            cpt: cpt,
            cptRaw: cptRaw,
            combinations: __spreadArray([key], parents).map(function (k) { return nodesMap[k].states; })
                .reverse()
                .reduce(function (a, vs) { return a.flatMap(function (x) { return vs.map(function (z) { return __spreadArray(__spreadArray([], x), [z]); }); }); }, [[]])
                .map(function (x) { x.reverse(); return x; })
        };
    });
    var someBroke = cpts.find(function (c) { return c.cpt.some(function (v) { return v === undefined
        || isNaN(v)
        || c.combinations.length !== c.cpt.length; }); });
    if (someBroke) {
        console.error("Something went wrong. Please check parser", someBroke.key);
        console.error(someBroke);
        console.error(someBroke.combinations.length, someBroke.cpt.length);
        console.error(someBroke.cptRaw);
        console.error(nodesMap[someBroke.key].states, someBroke.parents.map(function (p) { return nodesMap[p].states; }));
        throw new Error("Invalid cpt values");
    }
    return {
        nodesMap: nodesMap,
        cpts: cpts
    };
}
function toPythonBayesNet(cpts, nodesMap) {
    return "from BNetwork import BayesNet\nbn = BayesNet([\n" + cpts.map(function (c) { return "  ('" + nodesMap[c.key].label.replace(/\s|\t/g, "") + "', '" + c.parents.map(function (k) { return nodesMap[k].label.replace(/\s|\t/g, ""); }).join(" ") + "', ({\n" + c.combinations.map(function (ks, i) { return "    (" + ks.map(function (k) { return "'" + k + "'"; }).join(",") + "): " + c.cpt[i]; }).join(",\n") + "\n  }))"; }).join(",\n") + "])";
}
function topologicalSort(parents) {
    // invert edges
    var children = Object.entries(parents)
        .reduce(function (a, _a) {
        var k = _a[0], edges = _a[1];
        return (__assign(__assign({}, a), (Object.fromEntries(edges.map(function (edge) { return [edge, __spreadArray([k], a[edge])]; })))));
    }, Object.fromEntries(Object.keys(parents).map(function (k) { return [k, []]; })));
    var order = [];
    var permanent = new Set();
    var temporary = new Set();
    var unmarked = new Set(Object.keys(children));
    function visit(n) {
        var _a;
        if (permanent.has(n)) {
            return;
        }
        else if (temporary.has(n)) {
            throw new Error("Grafo ciclico");
        }
        unmarked.delete(n);
        temporary.add(n);
        ((_a = children[n]) !== null && _a !== void 0 ? _a : []).forEach(visit);
        temporary.delete(n);
        permanent.add(n);
        order.push(n);
    }
    while (unmarked.size > 0) {
        var fst = unmarked.keys().next().value;
        visit(fst);
    }
    return order.reverse();
}
function convert(net) {
    var _a = parse(net), cpts = _a.cpts, nodesMap = _a.nodesMap;
    var order = topologicalSort(Object.fromEntries(cpts.map(function (c) { return [c.key, c.parents]; })));
    var cptsMap = Object.fromEntries(cpts.map(function (v) { return [v.key, v]; }));
    var orderedCpts = order.map(function (k) { return cptsMap[k]; });
    return toPythonBayesNet(orderedCpts, nodesMap);
}
exports.convert = convert;
