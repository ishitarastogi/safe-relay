import { ethers } from "ethers";
import { GelatoRelayPack } from "@safe-global/relay-kit";
import Safe, {
  EthersAdapter,
  getSafeContract,
} from "@safe-global/protocol-kit";
import {
  MetaTransactionData,
  MetaTransactionOptions,
  OperationType,
  RelayTransaction,
} from "@safe-global/safe-core-sdk-types";

import ContractInfo from "../ABI.json";

const RPC_URL = `https://eth-goerli.g.alchemy.com/v2/process.env.ALCHEMY_PRIVATE_KEY`;
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const signer = new ethers.Wallet(
 process.env.PRIVATE_KEY,
  provider
);

const safeAddress = "0xb533EC2C26456AEE507506A3bCaA1fA950ea4c54";
const chainId = 5;
const targetAddress = ContractInfo.address;
const GELATO_RELAY_API_KEY = process.env.GELATO_RELAY_API_KEY;
const nftContract = new ethers.Contract(
  targetAddress,
  ContractInfo.abi,
  signer
);

const gasLimit = "100000";
// Create a transaction object
console.log("relayTransaction0");

const safeTransactionData: MetaTransactionData = {
  to: targetAddress,
  data: nftContract.interface.encodeFunctionData("mintGelato", [
    "0x68B38f944d2689537f8ed8A2F006b4597eE42218",
  ]),
  value: "0",
  operation: OperationType.Call,
};
const options: MetaTransactionOptions = {
  gasLimit,
  //   isSponsored: true,
};

async function relayTransaction() {
  console.log("relayTransaction1");
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer,
  });
  console.log("relayTransaction2");

  const safeSDK = await Safe.create({
    ethAdapter,
    safeAddress,
  });
  const relayKit = new GelatoRelayPack();

  // Prepare the transaction
  const safeTransaction = await safeSDK.createTransaction({
    safeTransactionData,
  });
  const signedSafeTx = await safeSDK.signTransaction(safeTransaction);
  const safeSingletonContract = await getSafeContract({
    ethAdapter,
    safeVersion: await safeSDK.getContractVersion(),
  });
  const encodedTx = safeSingletonContract.encode("execTransaction", [
    signedSafeTx.data.to,
    signedSafeTx.data.value,
    signedSafeTx.data.data,
    signedSafeTx.data.operation,
    signedSafeTx.data.safeTxGas,
    signedSafeTx.data.baseGas,
    signedSafeTx.data.gasPrice,
    signedSafeTx.data.gasToken,
    signedSafeTx.data.refundReceiver,
    signedSafeTx.encodedSignatures(),
  ]);

  const relayTransaction: RelayTransaction = {
    target: safeAddress,
    encodedTransaction: encodedTx,
    chainId: chainId,
    options,
  };

  const response = await relayKit.relayTransaction(relayTransaction);
  console.log(
    `Relay Transaction Task ID: https://relay.gelato.digital/tasks/status/${response.taskId}`
  );
}
relayTransaction();
