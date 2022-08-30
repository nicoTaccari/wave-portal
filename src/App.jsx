import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");

  const contractAddress = "0x5Fea02511755b4BD0f43c4F6354335d9a053a8d3";
  const contractABI = abi.abi;
  const [loading, setLoading] = useState(false);
  const [counter, setCounter] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [allWaves, setAllWaves] = useState([]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        await getAllWaves();
      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const getTotalWaves = async () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
    const waves = await wavePortalContract.getTotalWaves();
    setCounter(waves.toNumber());
  }

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
        return {
          address: wave.waver,
          timestamp: new Date(wave.timestamp * 1000),
          message: wave.message,
        };
      });

      setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    let wavePortalContract;
  
    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
  
    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
}, []);

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum && currentAccount) {
      getTotalWaves()
    }
  }, [currentAccount, counter])

  /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });



      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        setLoading(true);
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        const waveTxn = await wavePortalContract.wave(customMessage, { gasLimit: 300000});
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        setLoading(false);
        setCounter(count.toNumber());
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hey there!
        </div>

        <div className="bio">
          I am Nicolas, software developer. I just started my journey in Web3 development. Connect your Ethereum wallet and wave at me to have the chance of winning a prize in ETH!
        </div>

        <button disabled={loading || !customMessage} className="waveButton" onClick={wave}>
          {loading && <div className='loader' />}
          Wave at Me
        </button>

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {currentAccount && <div className="counter">
          {counter !== null ? `You have received ${counter} waves so far` : <div className='loader' />}
        </div>}

        <label htmlFor="waveMessage">Type your custom message</label>
        <input name="waveMessage" required type='text' onChange={(e) => setCustomMessage(e.target.value)} />

        {currentAccount && allWaves.map((wave, index) => {
          return (
            <div
              key={index}
              style={{ backgroundColor: 'OldLace', marginTop: '16px', padding: '8px' }}
            >
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          );
        })}

      </div>
    </div>
  );
}
