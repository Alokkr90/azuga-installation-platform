-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'installer')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  vin_pattern VARCHAR(100),
  base_image_url VARCHAR(500),
  model_2d_url VARCHAR(500),
  model_3d_url VARCHAR(500),
  geometry_data JSONB,
  specifications JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_make_model_year ON vehicles(make, model, year);

-- Installation guides table
CREATE TABLE IF NOT EXISTS installation_guides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  estimated_duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vehicle_id, device_id)
);

CREATE INDEX idx_guides_vehicle_device ON installation_guides(vehicle_id, device_id);

-- Guide steps table
CREATE TABLE IF NOT EXISTS guide_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES installation_guides(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500),
  video_url VARCHAR(500),
  coordinates_2d JSONB,
  coordinates_3d JSONB,
  warnings JSONB,
  tools_required JSONB,
  step_duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_steps_guide ON guide_steps(guide_id, step_number);

-- Hotspots table (interactive clickable areas on 2D diagrams)
CREATE TABLE IF NOT EXISTS hotspots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES installation_guides(id) ON DELETE CASCADE,
  step_id UUID REFERENCES guide_steps(id) ON DELETE SET NULL,
  x_position DECIMAL(5, 2) NOT NULL,
  y_position DECIMAL(5, 2) NOT NULL,
  width DECIMAL(5, 2),
  height DECIMAL(5, 2),
  label VARCHAR(255),
  description TEXT,
  position_3d JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hotspots_guide ON hotspots(guide_id);

-- Cable routes table (for animated cable routing visualization)
CREATE TABLE IF NOT EXISTS cable_routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guide_id UUID NOT NULL REFERENCES installation_guides(id) ON DELETE CASCADE,
  step_id UUID REFERENCES guide_steps(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  path_2d JSONB NOT NULL,
  path_3d JSONB,
  cable_type VARCHAR(100),
  color VARCHAR(7),
  animation_sequence INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cable_routes_guide ON cable_routes(guide_id);

-- Installations table (user progress tracking)
CREATE TABLE IF NOT EXISTS installations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES installation_guides(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'paused')),
  current_step_number INTEGER DEFAULT 1,
  completion_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  estimated_completion_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_installations_user ON installations(user_id);
CREATE INDEX idx_installations_guide ON installations(guide_id);
CREATE INDEX idx_installations_status ON installations(status);

-- Installation steps completed table (track which steps user has finished)
CREATE TABLE IF NOT EXISTS installation_steps_completed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  installation_id UUID NOT NULL REFERENCES installations(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES guide_steps(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(installation_id, step_id)
);

CREATE INDEX idx_steps_completed_installation ON installation_steps_completed(installation_id);

-- Favorites table (for installer's favorite vehicles/guides)
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES installation_guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, guide_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- Reports/Analytics table
CREATE TABLE IF NOT EXISTS installation_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guide_id UUID NOT NULL REFERENCES installation_guides(id) ON DELETE CASCADE,
  total_time_minutes INTEGER,
  steps_completed INTEGER,
  steps_total INTEGER,
  completion_percentage INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reports_user ON installation_reports(user_id);
CREATE INDEX idx_reports_guide ON installation_reports(guide_id);
CREATE INDEX idx_reports_date ON installation_reports(created_at);
