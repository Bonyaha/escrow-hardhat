import { useEffect, useState } from 'react';
import { BrowserProvider, parseEther, formatEther } from 'ethers';
import deploy from './deploy';
import Escrow from './Escrow';

const provider = new BrowserProvider(window.ethereum);

export async function approve(escrowContract, signer, arbiterNumber) {
  console.log(`Arbiter ${arbiterNumber} attempting to approve`);
  const approveTxn = await escrowContract.connect(signer).approve();
  await approveTxn.wait();
}

function App() {
  const [escrows, setEscrows] = useState([]);
  const [account, setAccount] = useState();
  const [signer, setSigner] = useState();

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);
      const signerObj = await provider.getSigner();
      setAccount(accounts[0]);
      setSigner(signerObj);
    }
    getAccounts();
  }, []);

  // Centralize listener for "Approved" events
  useEffect(() => {
    escrows.forEach((escrow) => {
      const { contract, arbiter1, arbiter2, address } = escrow;

      const approvedListener = (arbiter, amount) => {
        if (arbiter === arbiter1) {
          updateEscrowApprovalStatus(address, 1);
        } else if (arbiter === arbiter2) {
          updateEscrowApprovalStatus(address, 2);
        }
      };

      contract.on('Approved', approvedListener);

      // Clean up event listeners when component is unmounted
      return () => {
        contract.off('Approved', approvedListener);
      };
    });
  }, [escrows]);

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter1 = document.getElementById('arbiter1').value;
    const arbiter2 = document.getElementById('arbiter2').value;
    const ethValue = document.getElementById('eth').value;
    const value = parseEther(ethValue);

    const arbiterObj1 = await provider.getSigner(arbiter1);
    const arbiterObj2 = await provider.getSigner(arbiter2);
    const escrowContract = await deploy(signer, [arbiter1, arbiter2], beneficiary, value);
    const contractAddress = await escrowContract.getAddress();

    const escrow = {
      address: contractAddress,
      arbiter1,
      arbiter2,
      beneficiary,
      value: ethValue,
      arbiter1Approved: false,
      arbiter2Approved: false,
      contract: escrowContract,
      handleApprove: async (arbiterNumber) => {
        try {
          if (arbiterNumber === 1) {
            await approve(escrowContract, arbiterObj1, 1);
          } else if (arbiterNumber === 2) {
            await approve(escrowContract, arbiterObj2, 2);
          }
        } catch (err) {
          console.error(`Error in approve for arbiter ${arbiterNumber}:`, err);
        }
      },
    };

    setEscrows([...escrows, escrow]);
  }

  function updateEscrowApprovalStatus(contractAddress, arbiterNumber) {
    setEscrows((prevEscrows) =>
      prevEscrows.map((escrow) => {
        if (escrow.address === contractAddress) {
          return {
            ...escrow,
            arbiter1Approved: arbiterNumber === 1 ? true : escrow.arbiter1Approved,
            arbiter2Approved: arbiterNumber === 2 ? true : escrow.arbiter2Approved,
          };
        }
        return escrow;
      })
    );
  }

  return (
    <>
      <div className="contract">
        <h1> New Contract </h1>
        <label>
          First Arbiter Address
          <input type="text" id="arbiter1" />
        </label>

        <label>
          Second Arbiter Address
          <input type="text" id="arbiter2" />
        </label>

        <label>
          Beneficiary Address
          <input type="text" id="beneficiary" />
        </label>

        <label>
          Deposit Amount (in ETH)
          <input
            type="number"
            id="eth"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
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
          {escrows.map((escrow) => (
            <Escrow
              key={escrow.address}
              {...escrow}
              handleApprove1={() => escrow.handleApprove(1)}
              handleApprove2={() => escrow.handleApprove(2)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
