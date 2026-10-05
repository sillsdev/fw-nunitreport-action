import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import license from "rollup-plugin-license";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "es",
  },
  plugins: [
    typescript({ noEmitOnError: true, sourceMap: false }),
    nodeResolve({ preferBuiltins: true }),
    commonjs(),
    license({
      thirdParty: { output: "dist/licenses.txt" },
    }),
  ],
};
