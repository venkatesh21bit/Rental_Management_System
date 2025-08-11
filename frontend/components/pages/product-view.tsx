"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit } from "lucide-react"

interface ProductViewProps {
  product: any
  onBack: () => void
  onEdit: () => void
}

export function ProductView({ product, onBack, onEdit }: ProductViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
        <Button onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{product?.name}</CardTitle>
          <CardDescription>Product Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product ID</Label>
              <p className="text-sm text-gray-600">{product?.id}</p>
            </div>
            <div>
              <Label>Category</Label>
              <p className="text-sm text-gray-600">{product?.category}</p>
            </div>
            <div>
              <Label>Price per Unit</Label>
              <p className="text-sm text-gray-600">${product?.pricePerUnit} {product?.units}</p>
            </div>
            <div>
              <Label>Stock Status</Label>
              <p className="text-sm text-gray-600">{product?.availableStock}/{product?.totalStock} available</p>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <p className="text-sm text-gray-600">{product?.description}</p>
            </div>
            <div>
              <Label>Rental Status</Label>
              <Badge variant={product?.isRentable ? "default" : "secondary"}>
                {product?.isRentable ? "Available for Rent" : "Not Rentable"}
              </Badge>
            </div>
            <div>
              <Label>Current Status</Label>
              <Badge variant="default">
                {product?.status?.replace("-", " ")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
