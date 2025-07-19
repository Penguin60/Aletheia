import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function Home() {
  return (
    <div className="bg-background h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Input placeholder="paste..." className="w-full" />
        <div className="flex items-center justify-between">
          <ToggleGroup type="single" defaultValue="text" className="justify-start">
            <ToggleGroupItem value="text">text</ToggleGroupItem>
            <ToggleGroupItem value="video">video</ToggleGroupItem>
          </ToggleGroup>
          <Button type="submit" variant="outline" className="">go</Button>
        </div>
      </div>
    </div>
  );
}