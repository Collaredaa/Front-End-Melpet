export default function PetCard({ pet, onClick }) {
  return (
    <div onClick={() => onClick(pet)} className="border p-4 rounded-lg bg-white shadow-sm cursor-pointer">
      <div className="font-semibold">{pet.nome}</div>
      <div className="text-sm text-gray-500">{pet.raca}</div>
      <div className="flex flex-wrap gap-1 my-2">
        {pet.servicos.map((s, i) => (
          <span key={i} className="bg-black text-white px-2 py-1 text-xs rounded">{s}</span>
        ))}
      </div>
      {pet.observacao && (
        <div className="text-sm text-gray-700">Observacao: {pet.observacao}</div>
      )}
      {pet.groomer && (
        <div className="text-sm font-semibold mt-2 uppercase">{pet.groomer}</div>
      )}
    </div>
  );
}
