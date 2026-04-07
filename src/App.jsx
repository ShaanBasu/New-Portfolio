import { useState } from 'react'
import GalaxyIntro from './components/GalaxyIntro.jsx'
import Navigation from './components/Navigation.jsx'
import StarField from './components/StarField.jsx'
import HomeSection from './components/HomeSection.jsx'
import AboutSection from './components/AboutSection.jsx'
import SkillsSection from './components/SkillsSection.jsx'
import ProjectsSection from './components/ProjectsSection.jsx'
import EducationSection from './components/EducationSection.jsx'

export default function App() {
  const [introComplete, setIntroComplete] = useState(false)

  return (
    <>
      {!introComplete && (
        <GalaxyIntro onComplete={() => setIntroComplete(true)} />
      )}
      {introComplete && (
        <>
          <StarField />
          <Navigation />
          <main>
            <HomeSection />
            <AboutSection />
            <SkillsSection />
            <ProjectsSection />
            <EducationSection />
          </main>
        </>
      )}
    </>
  )
}
