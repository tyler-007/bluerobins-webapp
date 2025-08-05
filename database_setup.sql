-- Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
    id SERIAL PRIMARY KEY,
    type_of_project VARCHAR(50) NOT NULL,
    number_of_sessions INTEGER NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(type_of_project, number_of_sessions)
);

-- Insert default pricing data
INSERT INTO pricing_config (type_of_project, number_of_sessions, selling_price) VALUES
    ('Hardware', 8, 1099.00),
    ('Hardware', 12, 1649.00),
    ('Other', 8, 1099.00),
    ('Other', 12, 1649.00)
ON CONFLICT (type_of_project, number_of_sessions) DO NOTHING;

-- Add type_of_project column to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type_of_project VARCHAR(50) DEFAULT 'Other';

-- Update existing projects to have a default type_of_project
UPDATE projects SET type_of_project = 'Other' WHERE type_of_project IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_config_type_sessions ON pricing_config(type_of_project, number_of_sessions);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type_of_project); 