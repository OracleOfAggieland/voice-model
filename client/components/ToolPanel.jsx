import { useEffect, useState } from "react";
import * as feather from "react-feather";

const financialTools = {
  type: "session.update",
  session: {
    tools: [
      {
        type: "function",
        name: "analyze_portfolio",
        description: "Analyze a user's investment portfolio and provide insights on diversification, risk, and performance",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            assets: {
              type: "array",
              description: "List of assets in the portfolio",
              items: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Asset name" },
                  value: { type: "number", description: "Current value in USD" },
                  allocation: { type: "number", description: "Percentage of portfolio" }
                },
                required: ["name", "value", "allocation"]
              }
            },
            risk_score: {
              type: "number",
              description: "Overall portfolio risk score (1-10)",
            },
            recommendations: {
              type: "array",
              description: "List of recommendations",
              items: { type: "string" }
            }
          },
          required: ["assets", "risk_score", "recommendations"],
        },
      },
      {
        type: "function",
        name: "calculate_budget",
        description: "Create a personalized budget based on income and expenses",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            monthly_income: { type: "number", description: "Monthly income in USD" },
            categories: {
              type: "array",
              description: "Budget categories",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  amount: { type: "number" },
                  percentage: { type: "number" }
                },
                required: ["name", "amount", "percentage"]
              }
            },
            savings_rate: { type: "number", description: "Recommended savings percentage" },
            insights: { type: "array", items: { type: "string" } }
          },
          required: ["monthly_income", "categories", "savings_rate", "insights"],
        },
      },
      {
        type: "function",
        name: "investment_recommendation",
        description: "Provide personalized investment recommendations based on goals and risk tolerance",
        parameters: {
          type: "object",
          strict: true,
          properties: {
            risk_profile: { type: "string", enum: ["Conservative", "Moderate", "Aggressive"] },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  allocation: { type: "number" },
                  rationale: { type: "string" }
                },
                required: ["type", "allocation", "rationale"]
              }
            },
            projected_return: { type: "string" },
            time_horizon: { type: "string" }
          },
          required: ["risk_profile", "recommendations", "projected_return", "time_horizon"],
        },
      }
    ],
    tool_choice: "auto",
  },
};

function PortfolioAnalysis({ data }) {
  const { assets, risk_score, recommendations } = JSON.parse(data.arguments);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <feather.PieChart className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold">Portfolio Analysis</h3>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-400">Risk Score</span>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full"
                style={{ width: `${risk_score * 10}%` }}
              />
            </div>
            <span className="text-sm font-medium">{risk_score}/10</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {assets.map((asset, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm">{asset.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{asset.allocation}%</span>
                <span className="text-sm font-medium">${asset.value.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-400">Recommendations</h4>
        {recommendations.map((rec, i) => (
          <div key={i} className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function BudgetCalculation({ data }) {
  const { monthly_income, categories, savings_rate, insights } = JSON.parse(data.arguments);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <feather.Calculator className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold">Budget Breakdown</h3>
      </div>
      
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10">
          <span className="text-sm text-gray-400">Monthly Income</span>
          <span className="text-lg font-semibold">${monthly_income.toLocaleString()}</span>
        </div>
        
        <div className="space-y-3">
          {categories.map((cat, i) => (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">{cat.name}</span>
                <span className="text-sm font-medium">${cat.amount}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                  style={{ width: `${cat.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Recommended Savings</span>
            <span className="text-lg font-semibold text-green-400">{savings_rate}%</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-400">Insights</h4>
        {insights.map((insight, i) => (
          <div key={i} className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-sm">{insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ToolPanel({ isSessionActive, sendClientEvent, events }) {
  const [toolsConfigured, setToolsConfigured] = useState(false);
  const [activeTools, setActiveTools] = useState([]);

  useEffect(() => {
    if (!events || events.length === 0) return;

    const firstEvent = events[events.length - 1];
    if (!toolsConfigured && firstEvent.type === "session.created") {
      sendClientEvent(financialTools);
      setToolsConfigured(true);
    }

    const mostRecentEvent = events[0];
    if (mostRecentEvent.type === "response.done" && mostRecentEvent.response.output) {
      mostRecentEvent.response.output.forEach((output) => {
        if (output.type === "function_call") {
          setActiveTools(prev => [output, ...prev].slice(0, 3)); // Keep last 3 tools
          
          // Send response after function call
          setTimeout(() => {
            sendClientEvent({
              type: "conversation.item.create",
              item: {
                type: "function_call_output",
                call_id: output.call_id,
                output: JSON.stringify({ status: "success" })
              }
            });
            sendClientEvent({ type: "response.create" });
          }, 500);
        }
      });
    }
  }, [events, sendClientEvent, toolsConfigured]);

  useEffect(() => {
    if (!isSessionActive) {
      setToolsConfigured(false);
      setActiveTools([]);
    }
  }, [isSessionActive]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center gap-2">
        <feather.Shield className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-bold">Financial Tools</h2>
      </div>
      
      {!isSessionActive ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <feather.TrendingUp className="w-12 h-12 text-gray-500 mx-auto" />
            <p className="text-gray-400">Connect to access financial analysis tools</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto">
          {activeTools.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-6 text-center space-y-3">
              <p className="text-sm text-gray-300">Available tools:</p>
              <ul className="space-y-2 text-left max-w-xs mx-auto">
                <li className="flex items-center gap-2">
                  <feather.PieChart className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">Portfolio Analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <feather.Calculator className="w-4 h-4 text-green-400" />
                  <span className="text-sm">Budget Calculator</span>
                </li>
                <li className="flex items-center gap-2">
                  <feather.TrendingUp className="w-4 h-4 text-purple-400" />
                  <span className="text-sm">Investment Recommendations</span>
                </li>
              </ul>
              <p className="text-xs text-gray-400 mt-4">
                Ask about your finances to activate these tools
              </p>
            </div>
          ) : (
            activeTools.map((tool, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                {tool.name === "analyze_portfolio" && <PortfolioAnalysis data={tool} />}
                {tool.name === "calculate_budget" && <BudgetCalculation data={tool} />}
                {tool.name === "investment_recommendation" && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Investment Recommendations</h3>
                    <pre className="text-xs bg-white/5 rounded p-2 overflow-x-auto">
                      {JSON.stringify(JSON.parse(tool.arguments), null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}