"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { createClient } from "@/utils/supabase/client";

type PricingConfig = {
  id: number;
  type_of_project: string;
  number_of_sessions: number;
  selling_price: number;
};

export default function PricingAdminPage() {
  const [pricingData, setPricingData] = useState<PricingConfig[]>([]);
  const [projectTypes, setProjectTypes] = useState<string[]>([]);
  const [sessionOptions, setSessionOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newConfig, setNewConfig] = useState({
    type_of_project: "",
    number_of_sessions: 8,
    selling_price: 0,
  });
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchPricingData();
    fetchProjectTypes();
    fetchSessionOptions();
  }, []);

  const fetchPricingData = async () => {
    try {
      const response = await fetch("/api/pricing");
      const result = await response.json();
      
      if (response.ok) {
        setPricingData(result.data);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch pricing data",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch pricing data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("type_of_project")
        .order("type_of_project");

      if (error) {
        console.error("Error fetching project types:", error);
      } else {
        const types = Array.from(new Set(data?.map(item => item.type_of_project) || []));
        setProjectTypes(types);
        
        // Set default project type if available
        if (types.length > 0 && !newConfig.type_of_project) {
          setNewConfig(prev => ({ ...prev, type_of_project: types[0] }));
        }
      }
    } catch (error) {
      console.error("Error fetching project types:", error);
    }
  };

  const fetchSessionOptions = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_config")
        .select("number_of_sessions")
        .order("number_of_sessions");

      if (error) {
        console.error("Error fetching session options:", error);
      } else {
        const sessions = Array.from(new Set(data?.map(item => item.number_of_sessions.toString()) || []));
        setSessionOptions(sessions);
        
        // Set default session option if available
        if (sessions.length > 0 && newConfig.number_of_sessions === 8) {
          setNewConfig(prev => ({ ...prev, number_of_sessions: parseInt(sessions[0]) }));
        }
      }
    } catch (error) {
      console.error("Error fetching session options:", error);
    }
  };

  const handleAddPricing = async () => {
    try {
      const response = await fetch("/api/pricing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newConfig),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pricing configuration added successfully",
        });
        setNewConfig({
          type_of_project: projectTypes[0] || "",
          number_of_sessions: 8,
          selling_price: 0,
        });
        fetchPricingData();
        fetchProjectTypes(); // Refresh project types
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add pricing configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add pricing configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeletePricing = async (id: number) => {
    if (!confirm("Are you sure you want to delete this pricing configuration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/pricing?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Pricing configuration deleted successfully",
        });
        fetchPricingData();
        fetchProjectTypes(); // Refresh project types
      } else {
        const result = await response.json();
        toast({
          title: "Error",
          description: result.error || "Failed to delete pricing configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pricing configuration",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full p-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Pricing Configuration</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Add New Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Add New Pricing Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Project Type</label>
                  <Select
                    value={newConfig.type_of_project}
                    onValueChange={(value) =>
                      setNewConfig({ ...newConfig, type_of_project: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Number of Sessions</label>
                  <Select
                    value={newConfig.number_of_sessions.toString()}
                    onValueChange={(value) =>
                      setNewConfig({
                        ...newConfig,
                        number_of_sessions: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {sessionOptions.map((session) => (
                        <SelectItem key={session} value={session}>
                          {session} Sessions
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Selling Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newConfig.selling_price}
                  onChange={(e) =>
                    setNewConfig({
                      ...newConfig,
                      selling_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <Button onClick={handleAddPricing} className="w-full">
                Add Pricing Configuration
              </Button>
            </CardContent>
          </Card>

          {/* Current Pricing Table */}
          <Card>
            <CardHeader>
              <CardTitle>Current Pricing Configurations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Type</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Price ($)</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricingData.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>{config.type_of_project}</TableCell>
                      <TableCell>{config.number_of_sessions}</TableCell>
                      <TableCell>${config.selling_price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePricing(config.id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 