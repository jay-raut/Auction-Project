import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-primary/10 shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle className="text-3xl font-bold text-center">Welcome to Our Platform!</CardTitle>
          <CardDescription className="text-center text-lg">
            Discover, bid smart and win big with forward and dutch auctions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          {/* <img
            src="/path/to/your/image.jpg"
            alt="logo"
            className="w-full h-auto rounded-xl shadow-lg"
          /> */}
          <p className="text-center text-sm text-muted-foreground">
            Big updates coming soon!
          </p>
          <Button className="mt-4">Learn More</Button>
        </CardContent>
      </Card>
    </div>
  );
}
