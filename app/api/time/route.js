import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");

    if (!city) {
      return NextResponse.json(
        { error: "City name is required." },
        { status: 400 },
      );
    }

    // Find city and timezone
    const geoResponse = await fetch(
      `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(city)}&maxRows=1&username=${process.env.GEONAMES_USERNAME}`,
      { cache: "no-store" },
    );

    if (!geoResponse.ok) {
      throw new Error("City lookup failed.");
    }

    const geoData = await geoResponse.json();
    const place = geoData.geonames?.[0];

    if (!place) {
      return NextResponse.json(
        { error: "City not found." },
        { status: 404 },
      );
    }

    // Get timezone from coordinates
    const timezoneResponse = await fetch(
      `https://secure.geonames.org/timezoneJSON?lat=${place.lat}&lng=${place.lng}&username=${process.env.GEONAMES_USERNAME}`,
      { cache: "no-store" },
    );

    if (!timezoneResponse.ok) {
      throw new Error("Timezone lookup failed.");
    }

    const timezoneData = await timezoneResponse.json();

    if (!timezoneData.time) {
      throw new Error("Timezone unavailable.");
    }

    return NextResponse.json({
      city: place.name,
      country: place.countryName,
      timezone: timezoneData.timezoneId,
      datetime: timezoneData.time,
      time: new Intl.DateTimeFormat("en-US", {
        timeZone: timezoneData.timezoneId,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(new Date()),
      date: new Intl.DateTimeFormat("en-US", {
        timeZone: timezoneData.timezoneId,
        dateStyle: "full",
      }).format(new Date()),
    });
  } catch (error) {
    console.error("Time API error:", error);

    return NextResponse.json(
      { error: "Unable to fetch city time." },
      { status: 500 },
    );
  }
}