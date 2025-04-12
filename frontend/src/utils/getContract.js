import { ethers } from "ethers";

export function getContract(address, abi, signer) {
  return new ethers.Contract(address, abi, signer);
}