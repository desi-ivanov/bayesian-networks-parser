import { convert } from "./parser";


(() => {
  let d = "";
  process.stdin.on("data", (chunk) => d += chunk.toString());
  process.stdin.on("end", () => console.log(convert(d)));
})();
