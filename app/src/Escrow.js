export default function Escrow({
  address,
  arbiter1,
  arbiter2,
  arbiter1Approved,
  arbiter2Approved,
  beneficiary,
  value,
  handleApprove1,
  handleApprove2
}) {
  //console.log('Address is: ', address);
  const isApprovedByBoth = arbiter1Approved && arbiter2Approved;
  //console.log('arbiter1Approved', arbiter1Approved);
  //console.log('arbiter2Approved', arbiter2Approved);


  console.log('isApprovedByBoth: ', isApprovedByBoth);

  return (
    <div className="existing-contract">
      <ul className="fields">
        <li>
          <div>Arbiters</div>
          <div>
            <ul>
              <li><strong className="arbiter-label">Arbiter 1: </strong> {arbiter1}</li>
              <li><strong className="arbiter-label">Arbiter 2: </strong> {arbiter2}</li>
            </ul>
          </div>
        </li>
        <li>
          <div> Beneficiary </div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value </div>
          <div> {value} ETH </div>
        </li>

        {isApprovedByBoth ? (
          <div id={address} className="complete">✓ Approved by both arbiters!</div>
        ) : (
          <>
            {!arbiter1Approved && (
              <div
                className="button"
                id={`${address}-arbiter1`}
                onClick={handleApprove1}
              >
                Approve by Arbiter 1
              </div>
            )}
            {!arbiter2Approved && (
              <div
                className="button"
                id={`${address}-arbiter2`}
                onClick={handleApprove2}
              >
                Approve by Arbiter 2
              </div>
            )}
          </>
        )}
      </ul>
    </div>
  );
}
