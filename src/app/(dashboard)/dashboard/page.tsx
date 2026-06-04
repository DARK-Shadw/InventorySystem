"use client";

import { useState, useEffect } from "react";
import {
  Package,
  AlertTriangle,
  FileText,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DashboardData {
  stats: {
    totalItems: number;
    lowStockCount: number;
    outOfStockCount: number;
    pendingRequisitions: number;
  };
  lowStockAlerts: {
    itemCode: string;
    description: string;
    classDescription: string | null;
    currentBalance: number;
    reorderPoint: number;
    criticality: number;
  }[];
  recentRequisitions: {
    id: string;
    requisitionNumber: string;
    department: string;
    requester: string;
    itemCount: number;
    status: string;
    createdAt: string;
  }[];
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  DEPT_APPROVED: "bg-cyan-100 text-cyan-700",
  APPROVED: "bg-green-100 text-green-700",
  PARTIALLY_ISSUED: "bg-amber-100 text-amber-700",
  ISSUED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

function truncate(str: string, len: number) {
  if (str.length <= len) return str;
  return str.substring(0, len) + "...";
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    {
      title: "Total Items",
      value: data.stats.totalItems.toLocaleString(),
      subtitle: "Active inventory items",
      icon: Package,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Low Stock Alerts",
      value: data.stats.lowStockCount.toString(),
      subtitle: "Below reorder point",
      icon: AlertTriangle,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Pending Requisitions",
      value: data.stats.pendingRequisitions.toString(),
      subtitle: "Awaiting review",
      icon: FileText,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Out of Stock",
      value: data.stats.outOfStockCount.toString(),
      subtitle: "Zero balance items",
      icon: TrendingDown,
      color: "text-red-600 bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Safeen Survey & Subsea — Main Store Overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="mt-1 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stat.subtitle}
                  </p>
                </div>
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Requisitions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Requisitions</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentRequisitions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No requisitions yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentRequisitions.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {req.requisitionNumber}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            statusColors[req.status] ||
                            "bg-gray-100 text-gray-700"
                          }
                        >
                          {req.status.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.department} — {req.requester} — {req.itemCount}{" "}
                        items
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            {data.lowStockAlerts.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                All items are above reorder point
              </p>
            ) : (
              <div className="space-y-3">
                {data.lowStockAlerts.map((item) => (
                  <div
                    key={item.itemCode}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {item.itemCode}
                        </span>
                        {item.criticality <= 2 && (
                          <Badge
                            variant="destructive"
                            className="text-[10px]"
                          >
                            Critical
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {truncate(item.description, 60)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">
                        {item.currentBalance}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        ROP: {item.reorderPoint}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
