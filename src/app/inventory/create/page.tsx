'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ProtectedRoute } from '@/components/protected-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useInventory } from '@/hooks/use-inventory';
import { useToast } from '@/hooks/use-toast';
import { categories } from '@/lib/data';
import { ArrowLeft, Save, Loader2, PackagePlus } from 'lucide-react';

const createItemSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  stock: z.coerce.number().int().nonnegative('Stock must be non-negative'),
  category: z.enum(['Raw Material', 'Packaging Material', 'Product for Sale'], {
    required_error: 'Please select a category',
  }),
  lowStockThreshold: z.coerce.number().int().nonnegative('Threshold must be non-negative'),
  unitPrice: z.coerce.number().nonnegative('Price must be non-negative').optional(),
  sku: z.string().optional(),
  supplier: z.string().optional(),
});

type CreateItemFormData = z.infer<typeof createItemSchema>;

export default function CreateInventoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { addItem } = useInventory({ pollInterval: 0 });
  const [saving, setSaving] = useState(false);

  const form = useForm<CreateItemFormData>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      name: '',
      description: '',
      stock: 0,
      lowStockThreshold: 5,
      unitPrice: 0,
      sku: '',
      supplier: '',
    },
  });

  const onSubmit = async (data: CreateItemFormData) => {
    setSaving(true);
    try {
      await addItem({
        name: data.name,
        description: data.description || '',
        stock: data.stock,
        category: data.category,
        lowStockThreshold: data.lowStockThreshold,
        unitPrice: data.unitPrice,
        sku: data.sku,
        supplier: data.supplier,
      });
      toast({ title: 'Item Created', description: `${data.name} has been added to inventory.` });
      router.push('/inventory');
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create item',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="flex flex-col h-full">
          <header className="sticky top-0 z-10 flex h-[57px] items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/inventory">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <PackagePlus className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Add New Item</h1>
            </div>
          </header>

          <main className="flex-1 flex flex-col gap-4 p-4 md:p-6 overflow-auto">
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>New Inventory Item</CardTitle>
                <CardDescription>Fill in the details to add a new item to your inventory</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Premium Coffee Beans" {...field} disabled={saving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief description of the item" {...field} disabled={saving} rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} disabled={saving}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Stock</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="0" {...field} disabled={saving} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lowStockThreshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Low Stock Threshold</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" placeholder="5" {...field} disabled={saving} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="unitPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} disabled={saving} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="sku"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SKU</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional" {...field} disabled={saving} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="supplier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier</FormLabel>
                          <FormControl>
                            <Input placeholder="Supplier name (optional)" {...field} disabled={saving} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button type="submit" disabled={saving}>
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Create Item
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" asChild>
                        <Link href="/inventory">Cancel</Link>
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </main>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
