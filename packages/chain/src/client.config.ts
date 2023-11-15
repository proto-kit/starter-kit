import { ClientAppChain } from "@proto-kit/sdk";
import runtime from "./runtime";

export const client = ClientAppChain.fromRuntime(runtime);
