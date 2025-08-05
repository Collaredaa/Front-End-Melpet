export default function GroomerModal({ pet, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80 relative">
        <button onClick={onClose} className="absolute right-3 top-2 text-xl">×</button>
        <h2 className="text-lg font-bold text-center mb-4">SELECIONE O GROOMER</h2>
        {['Gabriel', 'Felipe'].map(groomer => (
          <button
            key={groomer}
            onClick={() => onSelect(groomer)}
            className="block w-full bg-black text-white py-2 rounded-lg my-2 hover:bg-gray-800"
          >
            {groomer}
          </button>
        ))}
      </div>
    </div>
  );
}
