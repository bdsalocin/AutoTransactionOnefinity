import React, { useState, useEffect, useRef } from "react";
import Web3 from "web3";
import {
  Button,
  Input,
  message,
  Layout,
  Typography,
  Card,
  Statistic,
} from "antd";
import {
  WalletOutlined,
  SendOutlined,
  PlusCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
} from "@ant-design/icons";
import "antd/dist/reset.css";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// Constants
const FAUCET_INTERVAL = 310000; // 5 minutes and 10 seconds in milliseconds
const TRANSACTION_INTERVAL = 10000; // 10 seconds in milliseconds
const AMOUNT_TO_SEND = "0.15"; // Amount of ONE to send
const CHAIN_ID = 999987; // OneFinity Testnet chain ID
const RPC_URL = "https://testnet-rpc.onefinity.network"; // OneFinity Testnet RPC URL
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const App = () => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState("");
  const [receiverAddressEVM, setReceiverAddressEVM] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const runningRef = useRef(false);
  const [transactionInfo, setTransactionInfo] = useState(null);
  const [balance, setBalance] = useState("0");

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        console.log("Web3 instance created");

        window.ethereum.on("accountsChanged", (accounts) => {
          setAccount(accounts[0]);
          updateBalance(web3Instance, accounts[0]);
        });

        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
      } else {
        message.error("Please install MetaMask!");
      }
    };

    initWeb3();
  }, []);

  const updateBalance = async (web3Instance, account) => {
    if (web3Instance && account) {
      try {
        const balance = await web3Instance.eth.getBalance(account);
        setBalance(web3Instance.utils.fromWei(balance, "ether"));
      } catch (error) {
        console.error("Error updating balance:", error);
      }
    }
  };

  useEffect(() => {
    const interval = setInterval(() => updateBalance(web3, account), 10000);
    return () => clearInterval(interval);
  }, [web3, account]);

  const connectWallet = async () => {
    if (web3) {
      setIsConnecting(true);
      try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3.eth.getAccounts();
        setAccount(accounts[0]);
        console.log("Connected to account:", accounts[0]);
        message.success("Connected to MetaMask!");

        let chainId = await web3.eth.getChainId();
        chainId = Number(chainId);
        console.log("Current Chain ID:", chainId);

        if (chainId !== CHAIN_ID) {
          message.warning(
            `Please switch to OneFinity Testnet (Chain ID: ${CHAIN_ID})`
          );
        }

        updateBalance(web3, accounts[0]);
      } catch (error) {
        console.error("Wallet connection error:", error);
        message.error("Failed to connect to MetaMask");
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const addNetwork = async () => {
    try {
      const chainIdHex = `0x${CHAIN_ID.toString(16)}`;
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: chainIdHex,
            chainName: "OneFinity Testnet",
            rpcUrls: [RPC_URL],
            nativeCurrency: {
              name: "ONE",
              symbol: "ONE",
              decimals: 18,
            },
            blockExplorerUrls: ["https://testnet-explorer.onefinity.network/"],
          },
        ],
      });
      message.success("OneFinity Testnet added successfully!");
    } catch (error) {
      console.error("Error adding network:", error);
      message.error("Failed to add OneFinity Testnet");
    }
  };

  const getFaucet = async (retries = MAX_RETRIES) => {
    console.log("Attempting to get tokens from faucet");
    setLoading(true);
    try {
      const balance = await web3.eth.getBalance(account);
      const balanceInEth = web3.utils.fromWei(balance, "ether");

      if (parseFloat(balanceInEth) >= 1) {
        message.warning("Balance exceeds 1 ONE, not requesting faucet.");
        return;
      }

      const response = await fetch(
        "https://testnet-api.onefinity.network/faucet",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: account }),
        }
      );

      if (response.ok) {
        console.log("Faucet request successful");
        message.success("Successfully retrieved tokens from faucet");
        updateBalance(web3, account);
      } else {
        const errorData = await response.json();
        console.error("Faucet error response:", errorData);
        throw new Error(
          `Failed to retrieve from faucet: ${
            errorData.message || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Faucet error:", error);
      if (retries > 0) {
        message.warning(
          `Retrying faucet request. Attempts left: ${retries - 1}`
        );
        setTimeout(() => getFaucet(retries - 1), RETRY_DELAY);
      } else {
        message.error(`Faucet error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendTransaction = async (retries = MAX_RETRIES) => {
    console.log("Preparing to send transaction");

    if (!web3.utils.isAddress(receiverAddressEVM)) {
      message.error("Please enter a valid EVM address");
      return;
    }

    const amountInWei = web3.utils.toWei(AMOUNT_TO_SEND, "ether");

    try {
      const balance = await web3.eth.getBalance(account);
      const balanceInEth = web3.utils.fromWei(balance, "ether");
      console.log("Account balance:", balanceInEth, "ONE");

      if (parseFloat(balance) < parseFloat(amountInWei)) {
        console.log("Insufficient funds");
        message.warning("Insufficient funds, waiting for next faucet cycle");
        return;
      }

      const nonce = await web3.eth.getTransactionCount(account);
      console.log("Current nonce:", nonce);

      const gasPrice = await web3.eth.getGasPrice();
      console.log("Current gas price:", gasPrice);

      const gasLimit = await web3.eth.estimateGas({
        from: account,
        to: receiverAddressEVM,
        value: amountInWei,
      });
      console.log("Estimated gas limit:", gasLimit);

      const transaction = {
        from: account,
        to: receiverAddressEVM,
        value: amountInWei,
        gas: Math.floor(Number(gasLimit) * 1.2).toString(), // Add 20% buffer
        gasPrice: gasPrice,
        nonce: nonce,
        chainId: CHAIN_ID,
      };

      console.log("Transaction object:", transaction);

      const signedTx = await web3.eth.sendTransaction(transaction);
      console.log("Transaction sent:", signedTx);
      message.success(`Transaction sent! Hash: ${signedTx.transactionHash}`);

      const receipt = await web3.eth.getTransactionReceipt(
        signedTx.transactionHash
      );
      const gasCost = web3.utils
        .toBN(receipt.gasUsed)
        .mul(web3.utils.toBN(gasPrice));
      const gasCostInEth = web3.utils.fromWei(gasCost.toString(), "ether");

      setTransactionInfo({
        transactionHash: signedTx.transactionHash,
        gasUsed: receipt.gasUsed,
        gasCost: gasCostInEth,
      });

      updateBalance(web3, account);
    } catch (error) {
      console.error("Transaction error:", error);
      if (
        retries > 0 &&
        (error.message.includes("Internal JSON-RPC error") ||
          error.message.includes("Transaction underpriced"))
      ) {
        console.log(`Retrying transaction. Attempts left: ${retries - 1}`);
        setTimeout(() => sendTransaction(retries - 1), RETRY_DELAY);
      } else {
        message.error(`Transaction error: ${error.message || "Unknown error"}`);
        console.log("Full error details:", error);
      }
    }
  };

  const startScript = async () => {
    console.log("Start button clicked");
    if (!account) {
      message.error("Please connect your wallet first");
      return;
    }
    if (!receiverAddressEVM) {
      message.error("Please enter an EVM address");
      return;
    }
    setIsRunning(true);
    runningRef.current = true;
    let lastFaucetTime = 0;

    const runLoop = async () => {
      if (!runningRef.current) {
        console.log("Script stopped");
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastFaucetTime >= FAUCET_INTERVAL) {
        await getFaucet();
        lastFaucetTime = currentTime;
      }

      await sendTransaction();
      setTimeout(runLoop, TRANSACTION_INTERVAL);
    };

    runLoop();
  };

  const stopScript = () => {
    console.log("Stop button clicked");
    runningRef.current = false;
    setIsRunning(false);
  };

  return (
    <Layout className="layout" style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Title level={3} style={{ color: "white", margin: 0 }}>
          Token Transfer App
        </Title>
        <div>
          <Button
            icon={<WalletOutlined />}
            onClick={connectWallet}
            type="primary"
            loading={isConnecting}
            style={{ marginRight: "10px" }}
          >
            {account
              ? `Connected: ${account.substring(0, 6)}...${account.substring(
                  38
                )}`
              : "Connect Wallet"}
          </Button>
          <Button
            icon={<PlusCircleOutlined />}
            onClick={addNetwork}
            type="default"
            loading={loading}
          >
            Add OneFinity Testnet
          </Button>
        </div>
      </Header>
      <Content style={{ padding: "0 50px", marginTop: "20px" }}>
        <Card title="Transaction Settings" style={{ marginBottom: "20px" }}>
          <Input
            placeholder="Receiver Address"
            value={receiverAddressEVM}
            onChange={(e) => setReceiverAddressEVM(e.target.value)}
            style={{ marginBottom: "10px" }}
          />
          <Button
            icon={isRunning ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={isRunning ? stopScript : startScript}
            type="primary"
            style={{ marginRight: "10px" }}
            loading={loading}
          >
            {isRunning ? "Stop" : "Start"}
          </Button>
          <Button
            icon={<SendOutlined />}
            onClick={() => sendTransaction()}
            type="default"
            disabled={!account || isRunning}
            loading={loading}
          >
            Send Single Transaction
          </Button>
        </Card>
        <Card title="Transaction Info" style={{ marginBottom: "20px" }}>
          <Statistic
            title="Account Balance"
            value={`${parseFloat(balance).toFixed(4)} ONE`}
          />
          <Text strong>Status: </Text>
          <Text style={{ color: isRunning ? "green" : "red" }}>
            {isRunning ? "Running" : "Stopped"}
          </Text>
          {transactionInfo && (
            <div style={{ marginTop: "10px" }}>
              <Text strong>Last Transaction:</Text>
              <br />
              <Text>Hash: {transactionInfo.transactionHash}</Text>
              <br />
              <Text>Gas Used: {transactionInfo.gasUsed}</Text>
              <br />
              <Text>Gas Cost: {transactionInfo.gasCost} ONE</Text>
            </div>
          )}
        </Card>
      </Content>
      <Footer style={{ textAlign: "center" }}>
        OneFinity Token Transfer App ©2024
      </Footer>
    </Layout>
  );
};

export default App;
