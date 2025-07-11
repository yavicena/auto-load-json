import React, { useState, useEffect } from "react";
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const App = () => {
  const [workflows, setWorkflows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingWorkflow, setViewingWorkflow] = useState(null);
  const [copiedWorkflow, setCopiedWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    nodes: 0
  });

  // Load workflows from the backend API
  useEffect(() => {
    const loadWorkflows = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`${BACKEND_URL}/api/workflows`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const workflowData = await response.json();
        
        // Transform the data if needed
        const transformedWorkflows = workflowData.map(workflow => ({
          id: workflow.id,
          filename: workflow.filename,
          title: workflow.title,
          description: workflow.description,
          active: workflow.active,
          nodes: workflow.nodes,
          node_types: workflow.node_types || [],
          content: workflow.content,
          created_at: workflow.created_at,
          updated_at: workflow.updated_at
        }));
        
        setWorkflows(transformedWorkflows);
        
        // Calculate stats
        const totalNodes = transformedWorkflows.reduce((sum, wf) => sum + wf.nodes, 0);
        const activeCount = transformedWorkflows.filter(wf => wf.active).length;
        
        setStats({
          total: transformedWorkflows.length,
          active: activeCount,
          inactive: transformedWorkflows.length - activeCount,
          nodes: totalNodes
        });
        
      } catch (error) {
        console.error("Error loading workflows:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflows();
  }, []);

  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter(workflow =>
    workflow.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (workflow.node_types && workflow.node_types.some(type => 
      type.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  // Copy workflow JSON to clipboard
  const copyToClipboard = async (workflow) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(workflow.content, null, 2));
      setCopiedWorkflow(workflow.id);
      setTimeout(() => setCopiedWorkflow(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  // View workflow JSON
  const viewWorkflow = (workflow) => {
    setViewingWorkflow(workflow);
  };

  // Close modal
  const closeModal = () => {
    setViewingWorkflow(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Workflows...</h2>
          <p className="text-slate-400">Scanning n8n_workflows folder for JSON files</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Workflows</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm15 0c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Header */}
      <header className="relative z-10 bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  N8N Workflows
                </h1>
                <p className="text-slate-400 text-sm">Automation workflow dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Refresh Button */}
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white rounded-xl transition-all duration-200 border border-slate-600/50"
                title="Refresh workflows"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-sm">Refresh</span>
              </button>
              
              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-xl bg-slate-800/50 backdrop-blur-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Search workflows by name, description, or integration..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Workflows</p>
                <p className="text-3xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Active Workflows</p>
                <p className="text-3xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Inactive Workflows</p>
                <p className="text-3xl font-bold text-white">{stats.inactive}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Nodes</p>
                <p className="text-3xl font-bold text-white">{stats.nodes}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-400 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Status Indicators</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-slate-300">Active - Workflow will execute when triggered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-slate-300">Inactive - Workflow is disabled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-slate-300">Complex - Workflow has multiple integrations</span>
            </div>
          </div>
        </div>

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              {/* Workflow Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${workflow.active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <div>
                    <h3 className="text-lg font-semibold text-white line-clamp-1">{workflow.title}</h3>
                    <p className="text-sm text-slate-400">{workflow.filename}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-xs text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>{workflow.nodes}</span>
                </div>
              </div>

              {/* Workflow Description */}
              <p className="text-slate-300 text-sm mb-6 line-clamp-2">{workflow.description}</p>

              {/* Workflow Meta */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    workflow.active 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {workflow.active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {workflow.nodes === 1 ? '1 Node' : `${workflow.nodes} Nodes`}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => copyToClipboard(workflow)}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95"
                >
                  {copiedWorkflow === workflow.id ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => viewWorkflow(workflow)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>View</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredWorkflows.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {workflows.length === 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No workflows found</h3>
                <p className="text-slate-500 mb-4">Add JSON workflow files to the <code className="bg-slate-700 px-2 py-1 rounded text-sm">n8n_workflows</code> folder to get started.</p>
                <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 max-w-md mx-auto">
                  <p className="text-sm text-slate-400 mb-2">Expected folder structure:</p>
                  <div className="text-left text-sm text-slate-300 font-mono">
                    <div>📁 /app/n8n_workflows/</div>
                    <div className="ml-4">📄 workflow1.json</div>
                    <div className="ml-4">📄 workflow2.json</div>
                    <div className="ml-4">📄 ...</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-slate-400 mb-2">No matching workflows</h3>
                <p className="text-slate-500">Try adjusting your search terms or clear the search to see all workflows.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for viewing workflow JSON */}
      {viewingWorkflow && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-xl font-semibold text-white">{viewingWorkflow.title}</h3>
                <p className="text-slate-400 text-sm">{viewingWorkflow.filename}</p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <pre className="bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto text-sm">
                {JSON.stringify(viewingWorkflow.content, null, 2)}
              </pre>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-700">
              <button
                onClick={() => copyToClipboard(viewingWorkflow)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium py-2 px-4 rounded-xl transition-all duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy JSON</span>
              </button>
              <button
                onClick={closeModal}
                className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-4 rounded-xl transition-all duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;