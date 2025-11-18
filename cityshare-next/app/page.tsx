import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShoppingBag, Heart, MessageCircle, UserCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/images/Logo.png"
                alt="CityShare Logo"
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-bold">CityShare</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-4xl w-full text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Image
              src="/images/Logo.png"
              alt="CityShare Logo"
              width={80}
              height={80}
              className="object-contain"
            />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
              CityShare
            </h1>
          </div>
          <p className="text-2xl text-muted-foreground mb-8">
            Buy, Sell, Donate, and Borrow within your student community
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/marketplace">
              <Button size="lg" className="text-lg px-8">
                Browse Marketplace
              </Button>
            </Link>
            <Link href="/post">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Post an Item
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <ShoppingBag className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>List Items</CardTitle>
                <CardDescription>
                  Post items you want to sell, donate, or lend to others
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Save Favorites</CardTitle>
                <CardDescription>
                  Wishlist items and get notified when similar items are posted
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Connect</CardTitle>
                <CardDescription>
                  Message other students directly about their listings
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <UserCheck className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Trust & Safety</CardTitle>
                <CardDescription>
                  User verification and ratings for safe transactions
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join your student community and start sharing today
          </p>
          <Link href="/marketplace">
            <Button size="lg" className="text-lg px-8">
              Explore Marketplace
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
