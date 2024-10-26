/* eslint-env es2020 */

import { BrowserProvider } from 'ethers';
import { useEffect, useState } from 'react';
import deploy from './deploy';
import Escrow from './Escrow';

const provider = new BrowserProvider(window.ethereum);


export async function approve(escrowContract, signer) {
  console.log('signer is: ', signer);
  console.log('contract is: ', escrowContract);

  const balance = await provider.getBalance("0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC");
    console.log("Balance for beneficiar is: ", balance.toString());

  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();
  const [arbiterObj, setArbiter] = useState();

  //const arbiter = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);
      console.log('Initial accounts:', accounts);

      // In ethers.js v6, getSigner() returns a Promise and must be awaited
      const signerObj = await provider.getSigner();
      const arbiterObj = await provider.getSigner(2);
      //const arbiter = accounts[1];
      console.log("Initial signer:", signerObj);
      console.log('Arbiter object:', arbiterObj);
      //console.log('Arbiter is: ', arbiter);


      setAccount(accounts[0]);
      setSigner(signerObj);
      setArbiter(arbiterObj);
    }

    getAccounts();


    // Listen for account changes and update signer
    /*  window.ethereum.on('accountsChanged', async (accounts) => {
       console.log('Accounts changed:', accounts);
 
       const signerObj = await provider.getSigner();
       console.log('Updated signer after account change:', signerObj);
 
       setAccount(accounts[0]);
       setSigner(signerObj);
     }); */

    // Clean up the listener when the component is unmounted
    /* return () => {
      window.ethereum.removeListener('accountsChanged', () => { });
    }; */
  }, []);


  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const value = BigInt(document.getElementById('wei').value);
    console.log('value is: ', value);

    const escrowContract = await deploy(signer, arbiter, beneficiary, value);

    // Get the deployed contract address using getAddress()
    const contractAddress = await escrowContract.getAddress();
    console.log('deployed contract address: ', contractAddress);

    const balance = await provider.getBalance(contractAddress);
    console.log(`Contract balance for ${contractAddress}:`, balance.toString());

    const approvedListener = (amount) => {
      document.getElementById(contractAddress).className = 'complete';
      document.getElementById(contractAddress).innerText = "✓ It's been approved!";
    };

    escrowContract.on('Approved', approvedListener);

    const escrow = {
      address: contractAddress,
      arbiter,
      beneficiary,
      value: value.toString(),
      handleApprove: async () => {
        // Fetch the current signer each time before calling approve
        //const signer = await provider.getSigner();
        //const signerAddress = await signer.getAddress();

        /* if (signerAddress !== arbiter) {
          console.error("Error: Signer must be the arbiter to approve the contract");
          return;
        } */


console.log("In handleApprove");

        try {
          await approve(escrowContract, arbiterObj);
        } catch (err) {
          console.error("Error in approve:", err);
        }
      },
    };

    setEscrows([...escrows, escrow]);
    return () => {
      escrowContract.off('Approved', approvedListener);
    };
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          Arbiter Address
          <input type="text" id="arbiter" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in Wei)
          <input type="text" id="wei" />
        </label>

        <div
          className="button"
          id="deploy"
          onClick={(e) => {
            e.preventDefault();

            newContract();
          }}
        >
          Deploy
        </div>
      </div>

      <div className="existing-contracts">
        <h1> Existing Contracts </h1>

        <div id="container">
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </div>
    </>
  );
}

export default App;
