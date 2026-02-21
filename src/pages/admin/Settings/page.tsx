// import { useState } from "react";

// // Placeholder: Replace with your real fetch/update logic
// const fetchSettings = async () => ({
//   logoUrl: "https://placehold.co/128x40?text=Logo",
// });
// const updateSettings = async (settings: { logoUrl: string }) => {
//   // Save to backend
//   return true;
// };

// export default function AdminSettingsPage() {
//   const [logoUrl, setLogoUrl] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [saving, setSaving] = useState(false);
//   const [success, setSuccess] = useState(false);

//   // Load settings on mount
//   useState(() => {
//     fetchSettings().then((data) => {
//       setLogoUrl(data.logoUrl || "");
//       setLoading(false);
//     });
//   }, []);

//   const handleSave = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSaving(true);
//     await updateSettings({ logoUrl });
//     setSaving(false);
//     setSuccess(true);
//     setTimeout(() => setSuccess(false), 2000);
//   };

//   if (loading) return <div className="p-8">Loading settings...</div>;

//   return (
//     <div className="max-w-xl mx-auto p-8">
//       <h1 className="text-2xl font-bold mb-6">Global Settings</h1>
//       <form onSubmit={handleSave} className="space-y-6">
//         <div>
//           <label className="block font-medium mb-1">Logo URL</label>
//           <input
//             type="text"
//             value={logoUrl}
//             onChange={(e) => setLogoUrl(e.target.value)}
//             className="w-full border rounded px-3 py-2"
//             placeholder="https://..."
//           />
//           {logoUrl && (
//             <img src={logoUrl} alt="Logo preview" className="h-12 mt-2" />
//           )}
//         </div>
//         <button
//           type="submit"
//           className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
//           disabled={saving}
//         >
//           {saving ? "Saving..." : "Save Settings"}
//         </button>
//         {success && <div className="text-green-600">Settings saved!</div>}
//       </form>
//     </div>
//   );
// }
