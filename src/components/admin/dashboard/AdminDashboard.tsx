import { useState, useEffect } from "react";
import { logError } from '@/lib/errorUtils';
import { supabase } from "@/integrations/supabase/client";
import { DashboardSummaryCards } from "./DashboardSummaryCards";
import { DashboardCharts } from "./DashboardCharts";
import { TopProductsList } from "./TopProductsList";
import { RecentInquiriesList } from "./RecentInquiriesList";
import { ScheduleManager } from "./ScheduleManager";
import { B2BSection } from "./B2BSection";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminDashboardProps {
  onNavigateToInquiries: () => void;
}

export function AdminDashboard({ onNavigateToInquiries }: AdminDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Summary data
  const [summaryData, setSummaryData] = useState({
    todayVisitors: 0,
    yesterdayVisitors: 0,
    todayPageViews: 0,
    yesterdayPageViews: 0,
    newInquiries: 0,
    unansweredInquiries: 0,
    catalogDownloads: 0,
    trafficSources: { naver: 0, google: 0, direct: 0, other: 0 },
  });

  // Chart data
  const [weeklyData, setWeeklyData] = useState<{ date: string; visitors: number; inquiries: number }[]>([]);
  const [categoryClicks, setCategoryClicks] = useState<{ name: string; value: number }[]>([]);

  // Top products
  const [topProducts, setTopProducts] = useState<{ id: string; title: string; category: string; views: number; trend: 'up' | 'down' | 'stable' }[]>([]);

  // Recent inquiries
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);

  // Schedules (stored in localStorage for simplicity)
  const [schedules, setSchedules] = useState<{ id: string; date: string; title: string; type: 'meeting' | 'delivery'; description?: string }[]>([]);

  // B2B data (mock for now)
  const [bulkInquiries] = useState<any[]>([]);
  const [partners] = useState<any[]>([]);

  useEffect(() => {
    // Load schedules from localStorage
    const savedSchedules = localStorage.getItem('admin_schedules');
    if (savedSchedules) {
      setSchedules(JSON.parse(savedSchedules));
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchInquiryStats(),
        fetchRecentInquiries(),
        fetchTopProducts(),
        generateMockAnalyticsData(),
      ]);
      setLastRefresh(new Date());
    } catch (error) {
      logError('AdminDashboard.fetch', error);
      toast.error('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInquiryStats = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Get total new inquiries this week
    const { count: newCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // Get unanswered inquiries
    const { count: unansweredCount } = await supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Get today's catalog downloads
    const { count: todayCatalogCount } = await supabase
      .from('catalog_downloads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    setSummaryData(prev => ({
      ...prev,
      newInquiries: newCount || 0,
      unansweredInquiries: unansweredCount || 0,
      catalogDownloads: todayCatalogCount || 0,
    }));
  };

  const fetchRecentInquiries = async () => {
    const { data } = await supabase
      .from('inquiries')
      .select('id, name, phone, email, title, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentInquiries(data || []);
  };

  const fetchTopProducts = async () => {
    // Fetch products ordered by display_order as a proxy for popularity
    // In a real scenario, you'd have a product_views table
    const { data } = await supabase
      .from('products')
      .select('id, title, main_category, subcategory')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .limit(5);

    if (data) {
      setTopProducts(data.map((p, i) => ({
        id: p.id,
        title: p.title,
        category: p.subcategory || p.main_category || '미분류',
        views: Math.floor(Math.random() * 500) + 100, // Mock views for demo
        trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
      })));
    }
  };

  const generateMockAnalyticsData = () => {
    // Generate mock weekly data
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const mockWeekly = days.map(day => ({
      date: day,
      visitors: Math.floor(Math.random() * 200) + 50,
      inquiries: Math.floor(Math.random() * 10) + 1,
    }));
    setWeeklyData(mockWeekly);

    // Mock category clicks
    setCategoryClicks([
      { name: '사무용', value: 35 },
      { name: '교육용', value: 25 },
      { name: '수납장', value: 20 },
      { name: '실험실', value: 12 },
      { name: '식당용', value: 8 },
    ]);

    // Mock traffic data (catalog downloads are now fetched from DB)
    setSummaryData(prev => ({
      ...prev,
      todayVisitors: Math.floor(Math.random() * 150) + 50,
      yesterdayVisitors: Math.floor(Math.random() * 150) + 50,
      todayPageViews: Math.floor(Math.random() * 500) + 200,
      yesterdayPageViews: Math.floor(Math.random() * 500) + 200,
      trafficSources: {
        naver: Math.floor(Math.random() * 100) + 50,
        google: Math.floor(Math.random() * 80) + 30,
        direct: Math.floor(Math.random() * 60) + 20,
        other: Math.floor(Math.random() * 30) + 10,
      },
    }));
  };

  const handleAddSchedule = (schedule: Omit<typeof schedules[0], 'id'>) => {
    const newSchedule = { ...schedule, id: crypto.randomUUID() };
    const updated = [...schedules, newSchedule];
    setSchedules(updated);
    localStorage.setItem('admin_schedules', JSON.stringify(updated));
    toast.success('일정이 추가되었습니다.');
  };

  const handleRemoveSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    setSchedules(updated);
    localStorage.setItem('admin_schedules', JSON.stringify(updated));
    toast.success('일정이 삭제되었습니다.');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">대시보드</h2>
          <p className="text-sm text-muted-foreground">
            마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDashboardData} 
          disabled={isLoading}
          className="min-h-[44px]"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* Summary Cards */}
      <DashboardSummaryCards data={summaryData} isLoading={isLoading} />

      {/* Charts */}
      <DashboardCharts 
        weeklyData={weeklyData} 
        categoryClicks={categoryClicks} 
        isLoading={isLoading} 
      />

      {/* Top Products & Recent Inquiries */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopProductsList products={topProducts} isLoading={isLoading} />
        <RecentInquiriesList 
          inquiries={recentInquiries} 
          isLoading={isLoading}
          onViewAll={onNavigateToInquiries}
        />
      </div>

      {/* Schedule Manager */}
      <ScheduleManager
        schedules={schedules}
        onAddSchedule={handleAddSchedule}
        onRemoveSchedule={handleRemoveSchedule}
        isLoading={isLoading}
      />

      {/* B2B Section */}
      <B2BSection 
        bulkInquiries={bulkInquiries}
        partners={partners}
        isLoading={isLoading}
      />
    </div>
  );
}
