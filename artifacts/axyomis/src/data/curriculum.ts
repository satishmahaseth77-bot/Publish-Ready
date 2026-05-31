export type CoreSubject = 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';

export interface CourseUnit {
  title: string;
  topics: string[];
}

export interface CourseTrack {
  subject: CoreSubject;
  icon: string;
  color: string;
  description: string;
  units: Record<string, CourseUnit[]>;
}

type GradeBand = 'Grade 1' | 'Grade 2' | 'Grade 3' | 'Grade 4' | 'Grade 5' | 'Grade 6' | 'Grade 7' | 'Grade 8' | 'Grade 9' | 'Grade 10' | 'Grade 11' | 'Grade 12' | 'Undergraduate' | 'Postgraduate';

function bandTopics(data: Partial<Record<GradeBand, string[]>>): Record<string, CourseUnit[]> {
  const out: Record<string, CourseUnit[]> = {};
  (Object.entries(data) as [GradeBand, string[]][]).forEach(([grade, topics]) => {
    out[grade] = [{ title: `${grade} Curriculum`, topics }];
  });
  return out;
}

export const CORE_COURSES: CourseTrack[] = [
  {
    subject: 'Physics',
    icon: 'fa-atom',
    color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    description: 'Forces, energy, motion, and the laws of the universe',
    units: bandTopics({
      'Grade 1': ['Pushes and pulls', 'Light and dark', 'Hot and cold', 'Sound around us', 'Magnets'],
      'Grade 2': ['Motion', 'Simple machines', 'Light reflection', 'Sound waves', 'Static electricity'],
      'Grade 3': ['Force', 'Friction', 'Gravity', 'Light and shadows', 'Heat transfer'],
      'Grade 4': ['Energy', 'Work (physics)', 'Electric circuits', 'Magnetism', 'Sound and vibration'],
      'Grade 5': ['Force', 'Motion', 'Light', 'Sound', 'Magnetism', 'Simple machines', 'Pressure'],
      'Grade 6': ['Speed and velocity', 'Force and pressure', 'Light', 'Sound', 'Electricity basics'],
      'Grade 7': ['Motion', 'Force', 'Heat', 'Sound', 'Light', 'Electricity', 'Magnetism'],
      'Grade 8': ['Force', 'Energy', 'Waves', 'Electricity', 'Pressure', 'Optics basics', 'Power (physics)'],
      'Grade 9': ['Kinematics', 'Newton\'s laws of motion', 'Gravitation', 'Work (physics)', 'Energy', 'Sound', 'Light'],
      'Grade 10': ['Force', 'Newton\'s laws of motion', 'Work (physics)', 'Energy', 'Gravity', 'Kinematics', 'Electricity', 'Magnetism'],
      'Grade 11': ['Mechanics', 'Thermodynamics', 'Waves', 'Optics', 'Electrostatics', 'Current electricity'],
      'Grade 12': ['Electromagnetism', 'Modern Physics', 'Semiconductor', 'Communication systems', 'Nuclear physics', 'Rotational dynamics'],
      Undergraduate: ['Classical mechanics', 'Quantum mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Statistical mechanics', 'Solid state physics', 'Astrophysics'],
      Postgraduate: ['Quantum field theory', 'General relativity', 'Particle physics', 'Condensed matter', 'Plasma physics', 'Cosmology'],
    }),
  },
  {
    subject: 'Chemistry',
    icon: 'fa-flask',
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    description: 'Atoms, reactions, and the building blocks of matter',
    units: bandTopics({
      'Grade 1': ['Water', 'Air', 'Clean and dirty', 'Materials around us', 'Safety at home'],
      'Grade 2': ['States of matter', 'Mixing substances', 'Water cycle', 'Rocks and minerals', 'Air properties'],
      'Grade 3': ['Solids liquids gases', 'Solutions', 'Acids in daily life', 'Metals and non-metals', 'Fuel'],
      'Grade 4': ['Matter', 'Elements and compounds', 'Rusting', 'Combustion', 'Water purification'],
      'Grade 5': ['States of matter', 'Water', 'Air', 'Mixtures', 'Separation techniques', 'Food and nutrition'],
      'Grade 6': ['Atoms and molecules intro', 'Elements', 'Air and water', 'Fibers and plastics', 'Combustion and flame'],
      'Grade 7': ['Physical and chemical changes', 'Acids bases salts', 'Heat reactions', 'Weather climate', 'Soil'],
      'Grade 8': ['Atomic structure', 'Periodic table', 'Acids and bases', 'Chemical reactions', 'Metals and non-metals', 'Coal and petroleum'],
      'Grade 9': ['Matter', 'Atomic structure', 'Periodic classification', 'Chemical bonding', 'Mole concept'],
      'Grade 10': ['Atomic structure', 'Chemical bonding', 'Stoichiometry', 'Acid–base reaction', 'Redox', 'Metallurgy', 'Carbon compounds intro'],
      'Grade 11': ['Some basic concepts', 'Structure of atom', 'Classification of elements', 'Chemical bonding', 'Thermodynamics', 'Equilibrium', 'Redox reactions'],
      'Grade 12': ['Solid state', 'Solutions', 'Electrochemistry', 'Chemical kinetics', 'Surface chemistry', 'Organic Chemistry', 'Biomolecules', 'Polymers'],
      Undergraduate: ['Physical chemistry', 'Inorganic chemistry', 'Organic chemistry', 'Analytical chemistry', 'Spectroscopy', 'Coordination compounds', 'Biochemistry intro'],
      Postgraduate: ['Advanced organic synthesis', 'Quantum chemistry', 'Electrochemistry', 'Polymer chemistry', 'Medicinal chemistry', 'Nanochemistry'],
    }),
  },
  {
    subject: 'Biology',
    icon: 'fa-dna',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    description: 'Life, cells, genetics, and living systems',
    units: bandTopics({
      'Grade 1': ['Living and non-living', 'Plants', 'Animals', 'Our body parts', 'Food we eat'],
      'Grade 2': ['Habitat', 'Plants around us', 'Animals around us', 'Bird', 'Fish', 'Healthy habits'],
      'Grade 3': ['Plant parts', 'Animal life', 'Human body', 'Food and health', 'Water and sanitation'],
      'Grade 4': ['Adaptations', 'Food and digestion', 'Teeth and microbes', 'Plant reproduction', 'Mammal'],
      'Grade 5': ['Life', 'Plant reproduction', 'Mammal', 'Bird', 'Photosynthesis', 'Ecosystems intro', 'Human senses'],
      'Grade 6': ['Food', 'Fiber to fabric', 'Body movements', 'Living organisms', 'Water', 'Air around us'],
      'Grade 7': ['Nutrition', 'Respiration', 'Transportation in animals', 'Transportation in plants', 'Reproduction in plants', 'Reproduction in animals'],
      'Grade 8': ['Cell (biology)', 'Human Body', 'Ecosystems', 'Photosynthesis', 'Respiration', 'Microorganisms', 'Conservation'],
      'Grade 9': ['Tissues', 'Diversity in living organisms', 'Natural resources', 'Improvement in food resources', 'Cell structure'],
      'Grade 10': ['Life processes', 'Control and coordination', 'Reproduction', 'Heredity and evolution', 'Environment', 'Natural resources'],
      'Grade 11': ['Living world', 'Biological classification', 'Plant morphology', 'Animal kingdom', 'Cell cycle', 'Biomolecules', 'Plant physiology'],
      'Grade 12': ['Reproduction', 'Genetics', 'Evolution', 'Human health and disease', 'Biotechnology', 'Ecology', 'Microbes in human welfare'],
      Undergraduate: ['Cell biology', 'Genetics', 'Microbiology', 'Botany', 'Zoology', 'Physiology', 'Ecology', 'Immunology', 'Developmental biology'],
      Postgraduate: ['Molecular biology', 'Genomics', 'Neurobiology', 'Cancer biology', 'Bioinformatics', 'Systems biology'],
    }),
  },
  {
    subject: 'Mathematics',
    icon: 'fa-square-root-alt',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
    description: 'Numbers, algebra, geometry, and problem solving',
    units: bandTopics({
      'Grade 1': ['Numbers 1–100', 'Addition', 'Subtraction', 'Shapes', 'Measurement', 'Patterns'],
      'Grade 2': ['Place value', 'Addition and subtraction', 'Multiplication intro', 'Division intro', 'Geometry', 'Time and money'],
      'Grade 3': ['Multiplication', 'Division', 'Fractions intro', 'Geometry', 'Measurement', 'Data handling'],
      'Grade 4': ['Large numbers', 'Factors and multiples', 'Fractions', 'Decimals', 'Geometry', 'Perimeter and area'],
      'Grade 5': ['Fractions', 'Decimals', 'Geometry', 'Measurement', 'Data handling', 'Ratio intro', 'Percentage intro'],
      'Grade 6': ['Knowing numbers', 'Whole numbers', 'Playing with numbers', 'Basic geometry', 'Integers', 'Fractions and decimals', 'Algebra intro'],
      'Grade 7': ['Integers', 'Fractions and decimals', 'Data handling', 'Simple equations', 'Lines and angles', 'Triangles', 'Ratio and proportion'],
      'Grade 8': ['Rational numbers', 'Linear equations', 'Quadrilaterals', 'Data handling', 'Squares and square roots', 'Cubes and cube roots', 'Algebra', 'Geometry'],
      'Grade 9': ['Number systems', 'Polynomials', 'Coordinate geometry', 'Linear equations in two variables', 'Euclid geometry', 'Triangles', 'Statistics'],
      'Grade 10': ['Real numbers', 'Polynomials', 'Quadratic equations', 'Arithmetic progressions', 'Triangles', 'Trigonometry', 'Statistics & Probability', 'Coordinate geometry'],
      'Grade 11': ['Sets', 'Relations and functions', 'Trigonometry', 'Complex Numbers', 'Linear inequalities', 'Permutations and combinations', 'Binomial theorem', 'Sequences and series'],
      'Grade 12': ['Relations and functions', 'Inverse trigonometric functions', 'Matrices', 'Determinants', 'Continuity and differentiability', 'Integrals', 'Differential equations', 'Vectors', 'Probability'],
      Undergraduate: ['Calculus', 'Linear algebra', 'Discrete mathematics', 'Probability', 'Statistics', 'Number theory', 'Differential equations', 'Real analysis'],
      Postgraduate: ['Abstract algebra', 'Topology', 'Functional analysis', 'Numerical analysis', 'Mathematical modeling', 'Optimization'],
    }),
  },
];

export function getCourseUnits(subject: CoreSubject, classLevel: string): CourseUnit[] {
  const track = CORE_COURSES.find((c) => c.subject === subject);
  if (!track) return [];
  if (track.units[classLevel]) return track.units[classLevel];
  const lower = classLevel.toLowerCase();
  if (lower.includes('undergrad')) return track.units['Undergraduate'] || [];
  if (lower.includes('postgrad')) return track.units['Postgraduate'] || [];
  const grade = parseInt(classLevel.replace(/\D/g, ''), 10);
  if (!grade || Number.isNaN(grade)) return track.units['Grade 10'] || [];
  const key = `Grade ${Math.min(12, Math.max(1, grade))}`;
  return track.units[key] || track.units['Grade 10'] || [];
}

export function allTopicsForSubject(subject: CoreSubject): string[] {
  const track = CORE_COURSES.find((c) => c.subject === subject);
  if (!track) return [];
  const set = new Set<string>();
  Object.values(track.units).forEach((units) => units.forEach((u) => u.topics.forEach((t) => set.add(t))));
  return [...set];
}
