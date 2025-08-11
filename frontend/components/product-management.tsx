"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Plus, Search, CalendarIcon, Edit, Eye, Package } from "lucide-react"
import { format } from "date-fns"

// Hardcoded product data
const products = [
  {
    id: "P001",
    name: "Professional Camera Kit",
    category: "Photography",
    description: "Complete DSLR camera kit with lenses and accessories",
    isRentable: true,
    units: "per day",
    pricePerUnit: 75,
    totalStock: 5,
    availableStock: 3,
    status: "available",
    image: "/placeholder.svg?height=100&width=100&text=Camera",
  },
  {
    id: "P002",
    name: "Sound System Package",
    category: "Audio",
    description: "Professional PA system with microphones and speakers",
    isRentable: true,
    units: "per day",
    pricePerUnit: 120,
    totalStock: 3,
    availableStock: 1,
    status: "low-stock",
    image: "/placeholder.svg?height=100&width=100&text=Audio",
  },
  {
    id: "P003",
    name: "Lighting Equipment Set",
    category: "Lighting",
    description: "Studio lighting kit with stands and diffusers",
    isRentable: true,
    units: "per day",
    pricePerUnit: 90,
    totalStock: 4,
    availableStock: 4,
    status: "available",
    image: "/placeholder.svg?height=100&width=100&text=Lights",
  },
  {
    id: "P004",
    name: "Video Editing Workstation",
    category: "Technology",
    description: "High-performance computer for video editing",
    isRentable: true,
    units: "per week",
    pricePerUnit: 350,
    totalStock: 2,
    availableStock: 0,
    status: "rented-out",
    image: "/placeholder.svg?height=100&width=100&text=Computer",
  },
]

export function ProductManagement() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [currentPage, setCurrentPage] = useState<"main" | "view" | "edit">("main")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [productList, setProductList] = useState(products)
  
  // Form state for adding products
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    description: "",
    units: "per day",
    pricePerUnit: "",
    totalStock: "",
    isRentable: true
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "default"
      case "low-stock":
        return "secondary"
      case "rented-out":
        return "destructive"
      default:
        return "outline"
    }
  }

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.category && newProduct.pricePerUnit && newProduct.totalStock) {
      const product = {
        id: `P${String(productList.length + 1).padStart(3, '0')}`,
        name: newProduct.name,
        category: newProduct.category,
        description: newProduct.description,
        isRentable: newProduct.isRentable,
        units: newProduct.units,
        pricePerUnit: parseFloat(newProduct.pricePerUnit),
        totalStock: parseInt(newProduct.totalStock),
        availableStock: parseInt(newProduct.totalStock),
        status: "available",
        image: "/placeholder.svg?height=100&width=100&text=Product"
      }
      setProductList([...productList, product])
      setNewProduct({
        name: "",
        category: "",
        description: "",
        units: "per day",
        pricePerUnit: "",
        totalStock: "",
        isRentable: true
      })
      setShowAddProduct(false)
    }
  }

  const handleViewProduct = (product: any) => {
    setSelectedProduct(product)
    setCurrentPage("view")
  }

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product)
    setCurrentPage("edit")
  }

  const handleBackToMain = () => {
    setCurrentPage("main")
    setSelectedProduct(null)
  }

  // Product View Page Component
  const ProductViewPage = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={handleBackToMain}>
          ← Back to Products
        </Button>
        <Button onClick={() => setCurrentPage("edit")}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Product
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{selectedProduct?.name}</CardTitle>
          <CardDescription>Product Details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product ID</Label>
              <p className="text-sm text-gray-600">{selectedProduct?.id}</p>
            </div>
            <div>
              <Label>Category</Label>
              <p className="text-sm text-gray-600">{selectedProduct?.category}</p>
            </div>
            <div>
              <Label>Price per Unit</Label>
              <p className="text-sm text-gray-600">${selectedProduct?.pricePerUnit} {selectedProduct?.units}</p>
            </div>
            <div>
              <Label>Stock Status</Label>
              <p className="text-sm text-gray-600">{selectedProduct?.availableStock}/{selectedProduct?.totalStock} available</p>
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <p className="text-sm text-gray-600">{selectedProduct?.description}</p>
            </div>
            <div>
              <Label>Rental Status</Label>
              <Badge variant={selectedProduct?.isRentable ? "default" : "secondary"}>
                {selectedProduct?.isRentable ? "Available for Rent" : "Not Rentable"}
              </Badge>
            </div>
            <div>
              <Label>Current Status</Label>
              <Badge variant={getStatusColor(selectedProduct?.status)}>
                {selectedProduct?.status?.replace("-", " ")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Product Edit Page Component
  const ProductEditPage = () => {
    const [editProduct, setEditProduct] = useState(selectedProduct || {})

    const handleSaveProduct = () => {
      const updatedProducts = productList.map(p => 
        p.id === editProduct.id ? editProduct : p
      )
      setProductList(updatedProducts)
      setCurrentPage("view")
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setCurrentPage("view")}>
            ← Back to View
          </Button>
          <Button onClick={handleSaveProduct}>
            Save Changes
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Edit Product</CardTitle>
            <CardDescription>Update product information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Product Name</Label>
                <Input 
                  id="edit-name" 
                  value={editProduct.name || ""}
                  onChange={(e) => setEditProduct({...editProduct, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editProduct.category || ""} onValueChange={(value) => setEditProduct({...editProduct, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Audio">Audio</SelectItem>
                    <SelectItem value="Lighting">Lighting</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea 
                  id="edit-description" 
                  value={editProduct.description || ""}
                  onChange={(e) => setEditProduct({...editProduct, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price per Unit ($)</Label>
                <Input 
                  id="edit-price" 
                  type="number" 
                  value={editProduct.pricePerUnit || ""}
                  onChange={(e) => setEditProduct({...editProduct, pricePerUnit: parseFloat(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock">Total Stock</Label>
                <Input 
                  id="edit-stock" 
                  type="number" 
                  value={editProduct.totalStock || ""}
                  onChange={(e) => setEditProduct({...editProduct, totalStock: parseInt(e.target.value)})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={editProduct.isRentable || false}
                  onCheckedChange={(checked) => setEditProduct({...editProduct, isRentable: checked})}
                />
                <Label>Available for Rental</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Conditional rendering based on current page
  if (currentPage === "view") {
    return <ProductViewPage />
  }

  if (currentPage === "edit") {
    return <ProductEditPage />
  }

  const filteredProducts = productList.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your rental inventory and availability</p>
        </div>
        <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Rental Product</DialogTitle>
              <DialogDescription>Configure a new product for rental management</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input 
                  id="product-name" 
                  placeholder="Enter product name" 
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photography">Photography</SelectItem>
                    <SelectItem value="Audio">Audio</SelectItem>
                    <SelectItem value="Lighting">Lighting</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Product description" 
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental-unit">Rental Unit</Label>
                <Select value={newProduct.units} onValueChange={(value) => setNewProduct({...newProduct, units: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per hour">Per Hour</SelectItem>
                    <SelectItem value="per day">Per Day</SelectItem>
                    <SelectItem value="per week">Per Week</SelectItem>
                    <SelectItem value="per month">Per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Unit ($)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="0.00" 
                  value={newProduct.pricePerUnit}
                  onChange={(e) => setNewProduct({...newProduct, pricePerUnit: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Total Stock</Label>
                <Input 
                  id="stock" 
                  type="number" 
                  placeholder="0" 
                  value={newProduct.totalStock}
                  onChange={(e) => setNewProduct({...newProduct, totalStock: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  id="rentable" 
                  checked={newProduct.isRentable}
                  onCheckedChange={(checked) => setNewProduct({...newProduct, isRentable: checked})}
                />
                <Label htmlFor="rentable">Available for Rental</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>Add Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="lighting">Lighting</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {selectedDate ? format(selectedDate, "PPP") : "Check Availability"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-100 flex items-center justify-center">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.category}</CardDescription>
                </div>
                <Badge variant={getStatusColor(product.status)}>{product.status.replace("-", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Price:</span>
                  <span className="font-medium">
                    ${product.pricePerUnit} {product.units}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Available:</span>
                  <span className="font-medium">
                    {product.availableStock}/{product.totalStock}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => handleViewProduct(product)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1 bg-transparent" onClick={() => handleEditProduct(product)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Product Table View */}
      <Card>
        <CardHeader>
          <CardTitle>Product Inventory Table</CardTitle>
          <CardDescription>Detailed view of all rental products</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.id}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    ${product.pricePerUnit} {product.units}
                  </TableCell>
                  <TableCell>
                    {product.availableStock}/{product.totalStock}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(product.status)}>{product.status.replace("-", " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewProduct(product)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
