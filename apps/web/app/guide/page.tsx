export default function GuidePage() {
  return (
    <div className="py-12">
      <h1 className="semibold text-center text-4xl">Using this app</h1>
      <ol className="mx-auto max-w-lg list-inside list-decimal pt-4">
        <li>
          Getting Tokens: Go to faucet page and click "Drip" to get tokens.
        </li>
        <li>
          Creating a Pool: Go to pools page and click "Create Pool". You will
          need to pay a fee to create the pool.
        </li>
        <li>
          Creating an Order: Go to the exchange page and click "Create Order".
          You will need to pay a fee to create the order. Whenever such an order
          is submitted, the sequencer runs a corresponding "Match Order" logic,
          to make sure that the order is filled with existing orders.
        </li>
        <li>
          Click on "Your Balances" to see your balances for each token ID.
        </li>
      </ol>
    </div>
  );
}
