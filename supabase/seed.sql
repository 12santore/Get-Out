-- Seed sample activities for local testing.
insert into public.activities (name, category, duration, energy_level, social_context, lat, lng, tags, source_url)
values
  ('Sunrise Park Walk', 'Movement', 30, 2, 'Solo', 37.7694, -122.4862, '{outdoor,morning}', 'https://www.nps.gov/goga/planyourvisit/hiking.htm'),
  ('Coffee + Journal Sprint', 'Wellness', 15, 1, 'Solo', 37.7764, -122.4231, '{indoor,morning}', null),
  ('Try a New Taco Spot', 'Food', 60, 2, 'With Friends', 37.7599, -122.4148, '{social,casual}', null),
  ('Neighborhood Photo Walk', 'Explore', 60, 3, 'Either', 37.8002, -122.4376, '{outdoor,daylight}', null),
  ('Late-Night Dessert Run', 'Food', 30, 2, 'Either', 37.7858, -122.4064, '{late-night}', null),
  ('Quick Home Mobility Flow', 'Wellness', 15, 1, 'Either', null, null, '{indoor,stretch}', 'https://www.youtube.com/results?search_query=mobility+flow')
on conflict do nothing;
