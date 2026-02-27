import { ACXCheckContainer } from '@/components/acx/ACXCheckContainer';
import { Footer } from '@/components/Footer';

export default function ACXCheckPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#000d15] flex flex-col">
      <div className="flex-1">
        <ACXCheckContainer />
      </div>
      <Footer />
    </div>
  );
}
