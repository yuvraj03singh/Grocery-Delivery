import api from "../config/api";
import type { Address } from "../types";
import { CheckIcon, MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "react-hot-toast/headless";
import { useAuth } from "../context/AuthContext";

interface AddressCardProps {
  addr: Address;
  onEditHandler: (addr: Address) => void;
  setAddresses: (addresses: Address[]) => void;
}
const AddressCard = ({
  addr,
  onEditHandler,
  setAddresses,
}: AddressCardProps) => {
  const { updateUser } = useAuth();

  const handleDelete = async (id: string) => {
    try {
      const shouldDelete = window.confirm("Are you sure you want to delete this address?");
      if (!shouldDelete) return;

      const { data } = await api.delete(`/addresses/${id}`);
      setAddresses(data.addresses);
      updateUser({ addresses: data.addresses });
      toast.success("Address deleted successfully");
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };
  return (
    <div
      key={addr.id}
      className="max-w-3xl bg-white dark:bg-zinc-900 border border-transparent dark:border-zinc-800 rounded-2xl p-6 flex items-start justify-between "
    >
      {/*left side*/}
      <div className="flex gap-4">
        <div className="size-10 rounded-xl bg-app-cream dark:bg-zinc-800 flex-center shrink-0">
          <MapPinIcon className="size-5 text-app-green dark:text-zinc-400" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold text-app-green dark:text-zinc-100">{addr.label}</p>
            {addr.isDefault && (
              <span className="flex-center gap-1 px-2.5 py-0.5 text-[10px] font-medium bg-app-green text-white rounded-full">
                <CheckIcon className="size-2.5" />
                Default
              </span>
            )}
          </div>
          <p className="text-sm text-app-text-light dark:text-zinc-400">
            {addr.address}, {addr.city},<br /> {addr.state} {addr.zip}
          </p>
        </div>
      </div>

      {/*right side*/}
      <div className="flex items-center gap-1">
        <button
          className="p-2 text-app-text-light dark:text-zinc-400 hover:text-app-green dark:hover:text-zinc-200 hover:bg-app-cream dark:hover:bg-zinc-800 rounded-lg transition-colors"
          onClick={() => onEditHandler(addr)}
        >
          <PencilIcon className="size-4" />
        </button>

        <button
          className="p-2 text-app-text-light dark:text-zinc-400 hover:text-app-error dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          onClick={() => handleDelete(addr.id)}
        >
          <Trash2Icon className="size-4" />
        </button>
      </div>
    </div>
  );
};
export default AddressCard;
