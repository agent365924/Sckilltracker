import { useState, useMemo } from 'react';
import { Plus, X, Sword, Skull, TrendingUp, Download, Upload, Minus, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { initialPVPData, type PVPEntry } from './data/pvpData';

type SortColumn = 'dateTime' | 'name' | 'opposingShip' | 'type' | 'weaponShip' | 'location' | 'status' | null;
type SortDirection = 'asc' | 'desc';

export default function App() {
  const [entries, setEntries] = useState<PVPEntry[]>(initialPVPData);
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [formData, setFormData] = useState<Omit<PVPEntry, 'id'>>({
    dateTime: '',
    status: 'kill',
    name: '',
    opposingShip: '',
    type: 's2s',
    weaponShip: '',
    location: '',
    details: ''
  });

  const totalKills = entries.filter(e => e.status === 'kill').length;
  const totalDeaths = entries.filter(e => e.status === 'death').length;
  const kdRatio = totalDeaths === 0 ? totalKills : (totalKills / totalDeaths).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: PVPEntry = {
      ...formData,
      id: Date.now().toString()
    };
    setEntries([newEntry, ...entries]);
    setFormData({
      dateTime: '',
      status: 'kill',
      name: '',
      opposingShip: '',
      type: 's2s',
      weaponShip: '',
      location: '',
      details: ''
    });
    setShowAddForm(false);
  };

  const handleSave = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pvp-log.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setEntries(data);
      } catch (error) {
        alert('Error loading file. Please ensure it is a valid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  const handleSort = (column: SortColumn) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const parseDateTime = (dateTimeStr: string): Date => {
    // Parse format: "DD.MM.YYYY HHMM"
    const parts = dateTimeStr.trim().split(' ');
    const dateParts = parts[0].split('.');
    const timePart = parts[1] || '0000';

    const day = parseInt(dateParts[0]) || 1;
    const month = parseInt(dateParts[1]) || 1;
    const year = parseInt(dateParts[2]) || 2000;
    const hour = parseInt(timePart.substring(0, 2)) || 0;
    const minute = parseInt(timePart.substring(2, 4)) || 0;

    return new Date(year, month - 1, day, hour, minute);
  };

  const sortedEntries = useMemo(() => {
    if (!sortColumn) return entries;

    return [...entries].sort((a, b) => {
      let aValue: any = a[sortColumn];
      let bValue: any = b[sortColumn];

      // Special handling for dateTime column
      if (sortColumn === 'dateTime') {
        const aDate = parseDateTime(aValue);
        const bDate = parseDateTime(bValue);
        return sortDirection === 'asc'
          ? aDate.getTime() - bDate.getTime()
          : bDate.getTime() - aDate.getTime();
      }

      // String comparison for other columns
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [entries, sortColumn, sortDirection]);

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 px-[10%] py-6">
      <div className="pt-12">
        <div className="mb-8">
          <h1 className="text-[56px] leading-tight mb-2 tracking-tight">⚔ Organic PVP Log</h1>
          <p className="text-sm text-zinc-500">Combat statistics and engagement history</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Sword className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-zinc-500 text-sm">Kills</span>
            </div>
            <div className="text-[56px] leading-tight tracking-tight">{totalKills}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Skull className="w-5 h-5 text-red-600" />
              </div>
              <span className="text-zinc-500 text-sm">Deaths</span>
            </div>
            <div className="text-[56px] leading-tight tracking-tight">{totalDeaths}</div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-zinc-500 text-sm">K/D Ratio</span>
            </div>
            <div className="text-[56px] leading-tight tracking-tight">{kdRatio}</div>
          </div>
        </div>

        <div className="mb-6 flex justify-end items-center">
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="bg-zinc-200 hover:bg-zinc-300 text-zinc-900 px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              Save
            </button>
            <label className="bg-zinc-200 hover:bg-zinc-300 text-zinc-900 px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm cursor-pointer text-sm">
              <Upload className="w-4 h-4" />
              Load
              <input
                type="file"
                accept=".json"
                onChange={handleLoad}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center gap-2 transition-colors shadow-sm text-sm"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Cancel' : 'Add Entry'}
            </button>
          </div>
        </div>

{showAddForm && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-[28px] leading-tight">New Entry</h3>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="w-10 h-10 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-zinc-500 mb-3">Date/Time</label>
                      <input
                        type="text"
                        placeholder="DD.MM.YYYY HHMM"
                        value={formData.dateTime}
                        onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-500 mb-3">Result</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'kill' | 'death' | 'neutral' })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                      >
                        <option value="kill">Kill</option>
                        <option value="death">Death</option>
                        <option value="neutral">Neutral</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-500 mb-3">Opponent Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-500 mb-3">Opposing Ship</label>
                      <input
                        type="text"
                        value={formData.opposingShip}
                        onChange={(e) => setFormData({ ...formData, opposingShip: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-500 mb-3">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                      >
                        <option value="s2s">s2s (Ship to Ship)</option>
                        <option value="fps">fps (First Person)</option>
                        <option value="s2g">s2g (Ship to Ground)</option>
                        <option value="s2e">s2e (Ship to EVA)</option>
                        <option value="g2s">g2s (Ground to Ship)</option>
                        <option value="eva">eva (FPS in Space)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-500 mb-3">Weapon/Ship</label>
                      <input
                        type="text"
                        value={formData.weaponShip}
                        onChange={(e) => setFormData({ ...formData, weaponShip: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-zinc-500 mb-3">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-zinc-500 mb-3">Details</label>
                      <textarea
                        value={formData.details}
                        onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none text-sm"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 py-4 rounded-xl transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl transition-colors text-sm"
                    >
                      Save Entry
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50">
                  <th className="text-left px-4 py-4 text-sm text-zinc-500 w-12"></th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('dateTime')}
                  >
                    <div className="flex items-center gap-2">
                      Date/Time
                      {sortColumn === 'dateTime' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 w-24 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Result
                      {sortColumn === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {sortColumn === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('opposingShip')}
                  >
                    <div className="flex items-center gap-2">
                      Ship
                      {sortColumn === 'opposingShip' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 w-20 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {sortColumn === 'type' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 w-96 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('weaponShip')}
                  >
                    <div className="flex items-center gap-2">
                      Weapon
                      {sortColumn === 'weaponShip' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left px-4 py-4 text-sm text-zinc-500 cursor-pointer hover:bg-zinc-100 transition-colors group"
                    onClick={() => handleSort('location')}
                  >
                    <div className="flex items-center gap-2">
                      Location
                      {sortColumn === 'location' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </div>
                  </th>
                  <th className="text-left px-4 py-4 text-sm text-zinc-500">Details</th>
                </tr>
              </thead>
              <tbody>
                {sortedEntries.map((entry, index) => (
                  <tr
                    key={entry.id}
                    className={`group border-b border-zinc-100 hover:bg-zinc-50 transition-colors ${
                      index === sortedEntries.length - 1 ? 'border-b-0' : ''
                    }`}
                  >
                    <td className="px-4 py-4 w-12">
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600">{entry.dateTime}</td>
                    <td className="px-4 py-4 w-24">
                      <span
                        className={`inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-sm w-20 ${
                          entry.status === 'kill'
                            ? 'bg-emerald-100 text-emerald-700'
                            : entry.status === 'death'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {entry.status === 'kill' ? (
                          <Sword className="w-3 h-3" />
                        ) : entry.status === 'death' ? (
                          <Skull className="w-3 h-3" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                        {entry.status === 'kill' ? 'Kill' : entry.status === 'death' ? 'Death' : 'Neutral'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-900 font-bold">{entry.name}</td>
                    <td className="px-4 py-4 text-sm text-zinc-600">{entry.opposingShip}</td>
                    <td className="px-4 py-4 w-20">
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-700 rounded text-sm">{entry.type}</span>
                    </td>
                    <td className="px-4 py-4 text-sm text-zinc-600 w-96">{entry.weaponShip}</td>
                    <td className="px-4 py-4 text-sm text-zinc-600">{entry.location}</td>
                    <td className="px-4 py-4 text-sm text-zinc-500 max-w-xs truncate">
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-zinc-400">
          Total Entries: {entries.length}
        </div>
      </div>
    </div>
  );
}