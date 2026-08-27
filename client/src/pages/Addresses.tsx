import { useEffect, useState } from "react";
import type { Address } from "../types";
import { MapPinIcon, PlusIcon } from "lucide-react";
import Loading from "../components/Loading";
import AddressCard from "../components/AddressCard";
import AddressForm from "../components/AddressForm";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast/headless";
import api from "../config/api";

const Addresses = () => {
  const { updateUser } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    isDefault: false,
  });

  const resetForm = () => {
    setForm({
      label: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      isDefault: false,
    });
    setShowForm(false);
    setEditingId(null);
  };

  const getLocation = (retries = 3): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      const attempt = () => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            if (retries > 0) {
              setTimeout(
                () => getLocation(retries - 1).then(resolve).catch(reject),
                1000,
              );
            } else {
              reject(error);
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 60000,
          },
        );
      };

      attempt();
    });
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    try {
      const coords = await getLocation();
      const payload = { ...form, ...coords };
      if (editingId) {
        const { data } = await api.put(`/addresses/${editingId}`, payload);
        setAddresses(data.addresses);
        updateUser({ addresses: data.addresses });
        toast.success("Address updated successfully");
      } else {
        const { data } = await api.post("/addresses", payload);
        setAddresses(data.addresses);
        updateUser({ addresses: data.addresses });
        toast.success("Address added successfully");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error?.message || "Unable to save address");
    }
  };
  const onEditHandler = (add: Address) => {
    setForm({
      label: add.label,
      address: add.address,
      city: add.city,
      state: add.state,
      zip: add.zip,
      isDefault: add.isDefault,
    });
    setShowForm(true);
    setEditingId(add.id);
  };

  useEffect(() => {
    api.get("/addresses")
      .then(({ data }) => {
        const fetchedAddresses = data.addresses ?? data.address;
        setAddresses(Array.isArray(fetchedAddresses) ? fetchedAddresses : []);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || error?.message || "Unable to fetch addresses");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="min-h-screen bg-app-cream dark:bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-semibold text-app-green dark:text-zinc-100">
              {" "}
              My Addresses
            </h1>
            <button
              className="px-4 py-2 bg-app-green text-white text-sm font-semibold rounded-xl hover:bg-app-green-light transition-colors flex items-center gap-2"
              onClick={() => setShowForm(true)}
            >
              <PlusIcon className="size-4" />
              Add New Address
            </button>
          </div>

          {/*form  modal*/}
          {showForm && (
            <AddressForm
              resetForm={resetForm}
              handleSubmit={handleSubmit}
              form={form}
              setForm={setForm}
              editingId={editingId}
            />
          )}

          {/* Address List */}
          {loading ? (
            <Loading />
          ) : addresses.length === 0 ? (
            <div className="text-center py-16">
              <MapPinIcon className="mx-auto size-16 text-app-border dark:text-zinc-700 mb-4" />
              <h2 className="text-lg font-semibold text-app-green dark:text-zinc-100 mb-2">
                No addresses found.
              </h2>
              <p className="text-sm text-app-text-light dark:text-zinc-400">
                Add a new address to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  addr={addr}
                  onEditHandler={onEditHandler}
                  setAddresses={setAddresses}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Addresses;
