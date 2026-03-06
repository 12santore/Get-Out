import { NextRequest, NextResponse } from "next/server";
import { demoWeather } from "@/lib/demo-data";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat") ?? process.env.NEXT_PUBLIC_DEFAULT_LAT ?? "37.7749";
  const lng = request.nextUrl.searchParams.get("lng") ?? process.env.NEXT_PUBLIC_DEFAULT_LNG ?? "-122.4194";
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(demoWeather);
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=imperial`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "OpenWeather request failed." }, { status: response.status });
    }

    const data = await response.json();
    const description: string = data.weather?.[0]?.description ?? "clear";

    return NextResponse.json({
      temp: data.main?.temp ?? 70,
      description,
      icon: data.weather?.[0]?.icon ?? "01d",
      isRaining: description.includes("rain")
    });
  } catch {
    return NextResponse.json({ error: "Could not fetch weather." }, { status: 500 });
  }
}
