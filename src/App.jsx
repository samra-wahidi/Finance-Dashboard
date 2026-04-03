// App.jsx
import React, { useState, useMemo, useEffect } from "react";
import "./index.css";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from "recharts";

export default function App() {
  const [role, setRole] = useState("viewer");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dark, setDark] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [newTx, setNewTx] = useState({ date: "", category: "", amount: "", type: "expense" });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem("transactions");
    return saved ? JSON.parse(saved) : [
      { id: 1, date: "2026-04-01", category: "Food", amount: 500, type: "expense" },
      { id: 2, date: "2026-04-02", category: "Salary", amount: 5000, type: "income" },
      { id: 3, date: "2026-04-03", category: "Shopping", amount: 1200, type: "expense" },
    ];
  });

  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const income = transactions.filter(t => t.type === "income").reduce((a, t) => a + t.amount, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((a, t) => a + t.amount, 0);
  const balance = income - expenses;

  const filteredTransactions = transactions.filter(t => {
    return t.category.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || t.type === filter);
  });

  const lineData = transactions.map(t => ({ name: t.date, amount: t.type === "income" ? t.amount : -t.amount }));

  const pieData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (t.type === "expense") map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.keys(map).map(k => ({ name: k, value: map[k] }));
  }, [transactions]);

  const highestCategory = pieData.sort((a, b) => b.value - a.value)[0]?.name || "N/A";

  const addTransaction = () => {
    if (!newTx.date || !newTx.category || !newTx.amount) return;
    setTransactions([{ ...newTx, id: Date.now(), amount: Number(newTx.amount) }, ...transactions]);
    setShowModal(false);
    setNewTx({ date: "", category: "", amount: "", type: "expense" });
  };

  const deleteTx = (id) => setTransactions(transactions.filter(t => t.id !== id));

  const exportData = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.json";
    a.click();
  };

  return (
    <div className={dark ? "app dark" : "app"}>
      <div className="sidebar">
        <h2>FinTrack</h2>
        <ul>
          <li>Dashboard</li>
          <li>Transactions</li>
          <li>Insights</li>
        </ul>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="viewer">Viewer</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={() => setDark(!dark)}>Dark Mode</button>
      </div>

      <div className="main">
        <h1>Dashboard</h1>

        <div className="cards">
          <div className="card"><h3>Balance</h3><p>₹{balance}</p></div>
          <div className="card income"><h3>Income</h3><p>₹{income}</p></div>
          <div className="card expense"><h3>Expense</h3><p>₹{expenses}</p></div>
        </div>

        <div className="charts">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={lineData}><XAxis dataKey="name" /><YAxis /><Tooltip /><Line dataKey="amount" /></LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-box">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={70}>
                  {pieData.map((_, i) => <Cell key={i} />)}
                </Pie>
                <Tooltip /><Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="transactions">
          <h2>Transactions Overview</h2>

          <div className="controls">
            <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            {role === "admin" && (
              <>
                <button onClick={() => setShowModal(true)}>+ Add</button>
                <button onClick={exportData}>Export</button>
              </>
            )}
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                  <th>Type</th>
                  {role === "admin" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={role === "admin" ? 5 : 4}>No transactions found</td></tr>
                ) : (
                  filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>{t.category}</td>
                      <td style={{ textAlign: "right" }} className={t.type === "income" ? "income" : "expense"}>
                        {t.type === "income" ? "+" : "-"}₹{t.amount}
                      </td>
                      <td>{t.type}</td>
                      {role === "admin" && <td><button onClick={() => deleteTx(t.id)}>Delete</button></td>}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="insights">
          <h2>Insights</h2>
          <div className="cards">
            <div className="card"><h4>Top Category</h4><p>{highestCategory}</p></div>
            <div className="card"><h4>Status</h4><p>{balance > 0 ? "Saving" : "Overspending"}</p></div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Transaction</h3>
            <input type="date" onChange={e => setNewTx({ ...newTx, date: e.target.value })} />
            <input placeholder="Category" onChange={e => setNewTx({ ...newTx, category: e.target.value })} />
            <input type="number" placeholder="Amount" onChange={e => setNewTx({ ...newTx, amount: e.target.value })} />
            <select onChange={e => setNewTx({ ...newTx, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <button onClick={addTransaction}>Add</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

