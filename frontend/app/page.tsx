'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowRight, 
  CheckCircle, 
  Star, 
  Shield, 
  Clock, 
  Truck, 
  Package, 
  Users, 
  Search,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';
import { AppNavigation, Footer } from '@/components/app-navigation';
import { useAuth } from '@/contexts/auth-context';

// Sample data for featured products
const featuredProducts = [
  {
    id: 1,
    name: 'CAT 320 Excavator',
    category: 'Construction',
    dailyRate: 450,
    weeklyRate: 2700,
    monthlyRate: 9000,
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&h=300&fit=crop',
    rating: 4.8,
    reviews: 24,
    available: true,
    features: ['GPS Tracking', 'Operator Training', '24/7 Support']
  },
  {
    id: 2,
    name: 'Bobcat S650 Skid Steer',
    category: 'Construction',
    dailyRate: 285,
    weeklyRate: 1710,
    monthlyRate: 5700,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=300&fit=crop',
    rating: 4.6,
    reviews: 18,
    available: true,
    features: ['Versatile Attachments', 'Compact Design', 'Easy Operation']
  },
  {
    id: 3,
    name: 'Event Tent 40x60',
    category: 'Events',
    dailyRate: 180,
    weeklyRate: 1080,
    monthlyRate: 3600,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop',
    rating: 4.9,
    reviews: 32,
    available: true,
    features: ['Weather Resistant', 'Professional Setup', 'Capacity 200 guests']
  },
  {
    id: 4,
    name: 'Scissor Lift 32ft',
    category: 'Access Equipment',
    dailyRate: 225,
    weeklyRate: 1350,
    monthlyRate: 4500,
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&h=300&fit=crop',
    rating: 4.7,
    reviews: 15,
    available: true,
    features: ['Electric Power', 'Indoor/Outdoor', 'Safety Certified']
  }
];

const categories = [
  {
    name: 'Construction Equipment',
    description: 'Heavy machinery for construction projects',
    count: 120,
    icon: Package,
    href: '/catalog?category=construction'
  },
  {
    name: 'Event Equipment',
    description: 'Tables, chairs, tents, and party supplies',
    count: 85,
    icon: Users,
    href: '/catalog?category=events'
  },
  {
    name: 'Tools & Equipment',
    description: 'Professional tools and hand equipment',
    count: 200,
    icon: Package,
    href: '/catalog?category=tools'
  },
  {
    name: 'Access Equipment',
    description: 'Lifts, scaffolding, and aerial platforms',
    count: 45,
    icon: Package,
    href: '/catalog?category=access'
  }
];

const features = [
  {
    icon: Shield,
    title: 'Fully Insured',
    description: 'All equipment comes with comprehensive insurance coverage'
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Round-the-clock customer support and emergency assistance'
  },
  {
    icon: Truck,
    title: 'Free Delivery',
    description: 'Free delivery and pickup within 25 miles'
  },
  {
    icon: CheckCircle,
    title: 'Quality Guaranteed',
    description: 'All equipment inspected and certified before rental'
  }
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    company: 'Johnson Construction',
    rating: 5,
    comment: 'Outstanding service! The excavator was delivered on time and in perfect condition. Their team is professional and responsive.',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b6c5?w=60&h=60&fit=crop&crop=face'
  },
  {
    name: 'Mike Chen',
    company: 'Event Masters',
    rating: 5,
    comment: 'We\'ve been using RentalPro for all our events. Their equipment quality and service is unmatched in the industry.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'
  },
  {
    name: 'Emily Rodriguez',
    company: 'Rodriguez Landscaping',
    rating: 5,
    comment: 'Great pricing and excellent customer service. The online booking system makes everything so easy.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face'
  }
];

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <AppNavigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-background py-20 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  Professional Equipment Rental
                </Badge>
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Rent Quality Equipment for Any Project
                </h1>
                <p className="max-w-[600px] text-muted-foreground text-xl">
                  From construction machinery to event equipment, find everything you need with competitive rates, reliable service, and nationwide delivery.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" asChild>
                  <Link href="/catalog">
                    Browse Equipment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/quotes">Get Quote</Link>
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Fully Insured</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Card className="overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop" 
                      alt="Construction Equipment" 
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">Construction</p>
                      <p className="text-xs text-muted-foreground">120+ Items</p>
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop" 
                      alt="Event Equipment" 
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">Events</p>
                      <p className="text-xs text-muted-foreground">85+ Items</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4 mt-8">
                  <Card className="overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=200&fit=crop" 
                      alt="Tools Equipment" 
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">Tools</p>
                      <p className="text-xs text-muted-foreground">200+ Items</p>
                    </CardContent>
                  </Card>
                  <Card className="overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=200&fit=crop" 
                      alt="Access Equipment" 
                      className="w-full h-32 object-cover"
                    />
                    <CardContent className="p-3">
                      <p className="text-sm font-medium">Access</p>
                      <p className="text-xs text-muted-foreground">45+ Items</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4 md:px-6">
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">What do you need?</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search equipment..." className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Enter location..." className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="pl-10" />
                  </div>
                </div>
              </div>
              <Button className="w-full mt-4" size="lg">
                <Search className="mr-2 h-4 w-4" />
                Search Equipment
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Browse by Category
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find the right equipment for your project from our extensive catalog
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link key={index} href={category.href}>
                <Card className="group hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <category.icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{category.description}</p>
                    <Badge variant="secondary">{category.count} items</Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Featured Equipment
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Popular equipment trusted by thousands of professionals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <Badge className="absolute top-2 left-2" variant={product.available ? "default" : "secondary"}>
                    {product.available ? "Available" : "Rented"}
                  </Badge>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    
                    <div className="flex items-center space-x-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({product.reviews})
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Daily</span>
                        <span className="font-semibold">${product.dailyRate}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Weekly</span>
                        <span className="font-semibold">${product.weeklyRate}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {product.features.slice(0, 2).map((feature, idx) => (
                        <div key={idx} className="flex items-center text-xs text-muted-foreground">
                          <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <Button className="w-full" asChild>
                    <Link href={`/catalog/${product.id}`}>
                      View Details
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" size="lg" asChild>
              <Link href="/catalog">
                View All Equipment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Why Choose RentalPro?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide more than just equipment - we deliver complete solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="mb-4 flex justify-center">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              What Our Customers Say
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trusted by thousands of professionals nationwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">"{testimonial.comment}"</p>
                  <div className="flex items-center space-x-3">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">{testimonial.name}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground text-lg">
              Join thousands of satisfied customers who trust RentalPro for their equipment needs
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated && (
                <Button size="lg" asChild>
                  <Link href="/auth/register">
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" asChild>
                <Link href="/contact">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
