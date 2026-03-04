import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function StylistAnalyticsPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('month');
  const [dashboard, setDashboard] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = React.useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [dashboardRes, chartRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/analytics/dashboard?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${BACKEND_URL}/api/analytics/earnings-chart?period=${period}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setDashboard(dashboardRes.data);
      setChartData(chartRes.data.chart_data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token || userRole !== 'stylist') {
      navigate('/login');
      return;
    }
    fetchAnalytics();
  }, [period, navigate, fetchAnalytics]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-400 hover:text-white mb-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-gray-400">{dashboard?.period_label}</p>
          </div>
          
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-gray-800 rounded-lg px-4 py-2 text-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {dashboard && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-4">
                <p className="text-sm opacity-80">Period Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.earnings.period_earnings)}</p>
                {dashboard.earnings.growth_percent !== null && (
                  <p className={`text-sm ${dashboard.earnings.growth_percent >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {dashboard.earnings.growth_percent >= 0 ? '↑' : '↓'} {Math.abs(dashboard.earnings.growth_percent).toFixed(1)}%
                  </p>
                )}
              </div>
              
              <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-4">
                <p className="text-sm opacity-80">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.earnings.total_earnings)}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-4">
                <p className="text-sm opacity-80">Completed Bookings</p>
                <p className="text-2xl font-bold">{dashboard.earnings.completed_bookings}</p>
              </div>
              
              <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-4">
                <p className="text-sm opacity-80">Avg Booking Value</p>
                <p className="text-2xl font-bold">{formatCurrency(dashboard.earnings.average_booking_value)}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Popular Services</h3>
                {dashboard.popular_services.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No service data yet</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.popular_services.map((service, idx) => (
                      <div key={service.service}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="capitalize">{service.service}</span>
                          <span>{service.count} bookings</span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                            style={{ width: `${service.percent_of_total}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatCurrency(service.revenue)} revenue</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Busiest Hours</h3>
                {dashboard.busy_hours.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No booking data yet</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {dashboard.busy_hours.map((slot) => (
                      <div key={slot.hour} className="bg-gray-700 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold">{slot.hour}:00</p>
                        <p className="text-sm text-gray-400">{slot.bookings} bookings</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Client Retention</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">{dashboard.client_retention.total_clients}</p>
                    <p className="text-sm text-gray-400">Total Clients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-pink-400">{dashboard.client_retention.repeat_clients}</p>
                    <p className="text-sm text-gray-400">Repeat Clients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400">{dashboard.client_retention.retention_rate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-400">Retention Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400">{dashboard.client_retention.average_bookings_per_client.toFixed(1)}</p>
                    <p className="text-sm text-gray-400">Avg Bookings/Client</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Recent Reviews</h3>
                {dashboard.recent_ratings.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">No reviews yet</p>
                ) : (
                  <div className="space-y-3">
                    {dashboard.recent_ratings.map((review, idx) => (
                      <div key={idx} className="border-b border-gray-700 last:border-0 pb-3 last:pb-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{review.client_name}</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                            ))}
                          </div>
                        </div>
                        {review.feedback && (
                          <p className="text-sm text-gray-400 line-clamp-2">{review.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {chartData.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Earnings Trend</h3>
                <div className="h-64 flex items-end justify-between gap-1">
                  {chartData.slice(-30).map((point, idx) => {
                    const maxEarnings = Math.max(...chartData.map(d => d.earnings));
                    const height = maxEarnings > 0 ? (point.earnings / maxEarnings) * 100 : 0;
                    return (
                      <div
                        key={point.date}
                        className="flex-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                        style={{ height: `${Math.max(4, height)}%` }}
                        title={`${point.date}: ${formatCurrency(point.earnings)}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  <span>{chartData[0]?.date}</span>
                  <span>{chartData[chartData.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
