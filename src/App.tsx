import { useEffect } from "react";
import { AnnouncementBar } from "./components/AnnouncementBar";
import { Header } from "./components/Header";
import { HeroBanner } from "./components/HeroBanner";
import { CategoryGrid } from "./components/CategoryGrid";
import { BestSellers } from "./components/BestSellers";
import { CategoryHighlights } from "./components/CategoryHighlights";
import { BenefitsBar } from "./components/BenefitsBar";
import { BlogSection } from "./components/BlogSection";
import { CTABanner } from "./components/CTABanner";
import { Footer } from "./components/Footer";
import { ProductPage } from "./components/ProductPage";
import { BlogPage } from "./components/BlogPage";
import { BlogArticlePage } from "./components/BlogArticlePage";
import { CheckoutPage } from "./components/CheckoutPage";
import { AccountPage } from "./components/AccountPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ProfilePage } from "./components/ProfilePage";
import { OrdersPage } from "./components/OrdersPage";
import { SearchPage } from "./components/SearchPage";
import { PrivacyPolicyPage } from "./components/PrivacyPolicyPage";
import { TermsOfUsePage } from "./components/TermsOfUsePage";
import { ReturnsPage } from "./components/ReturnsPage";
import AdminPage from "./admin/pages/AdminPage";
import { analyticsService } from "./admin/services/analytics.service";

function App() {
  const isAdminPage = window.location.pathname.startsWith("/admin");
  const isReturnsPage = window.location.pathname.startsWith("/trocas-e-devolucoes");
  const isTermsOfUsePage = window.location.pathname.startsWith("/termos-de-uso");
  const isPrivacyPolicyPage = window.location.pathname.startsWith("/politica-de-privacidade");
  const isSearchPage = window.location.pathname.startsWith("/busca");
  const isProfilePage = window.location.pathname.startsWith("/profile");
  const isOrdersPage = window.location.pathname.startsWith("/me/orders");
  const isForgotPasswordPage = window.location.pathname.startsWith("/forgot-password");
  const isAccountPage = window.location.pathname.startsWith("/signin");
  const isCheckoutPage = window.location.pathname.startsWith("/checkout");
  const isProductPage = window.location.pathname.startsWith("/produto/");
  const blogPathname = window.location.pathname;
  const isBlogArticlePage = blogPathname.startsWith("/blog/") && blogPathname.slice(6).length > 0;
  const blogArticleId = isBlogArticlePage ? blogPathname.slice(6) : "";
  const isBlogPage = blogPathname.startsWith("/blog") && !isBlogArticlePage;

  useEffect(() => {
    if (isAdminPage) return;

    void analyticsService.track({
      page: window.location.pathname,
      referrer: document.referrer,
      title: document.title,
    }).catch(() => undefined);
  }, [isAdminPage]);

  useEffect(() => {
    function resetHorizontalScroll() {
      if (window.scrollX !== 0) {
        window.scrollTo({ left: 0, top: window.scrollY });
      }
    }

    resetHorizontalScroll();
    window.addEventListener("resize", resetHorizontalScroll);
    window.addEventListener("orientationchange", resetHorizontalScroll);

    return () => {
      window.removeEventListener("resize", resetHorizontalScroll);
      window.removeEventListener("orientationchange", resetHorizontalScroll);
    };
  }, []);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-white font-sans">
      {!isAdminPage && <AnnouncementBar />}
      {!isAdminPage && <Header />}
      <main className="w-full max-w-full">
        {isAdminPage ? (
          <AdminPage />
        ) : isReturnsPage ? (
          <ReturnsPage />
        ) : isTermsOfUsePage ? (
          <TermsOfUsePage />
        ) : isPrivacyPolicyPage ? (
          <PrivacyPolicyPage />
        ) : isSearchPage ? (
          <SearchPage />
        ) : isOrdersPage ? (
          <OrdersPage />
        ) : isProfilePage ? (
          <ProfilePage />
        ) : isForgotPasswordPage ? (
          <ForgotPasswordPage />
        ) : isAccountPage ? (
          <AccountPage />
        ) : isCheckoutPage ? (
          <CheckoutPage />
        ) : isProductPage ? (
          <ProductPage />
        ) : isBlogArticlePage ? (
          <BlogArticlePage id={blogArticleId} />
        ) : isBlogPage ? (
          <BlogPage />
        ) : (
          <>
            <HeroBanner />
            <CategoryGrid />
            <BestSellers />
            <CategoryHighlights />
            <BenefitsBar />
            <BlogSection />
            <CTABanner />
          </>
        )}
      </main>
      {!isAdminPage && <Footer />}
    </div>
  );
}

export default App;
