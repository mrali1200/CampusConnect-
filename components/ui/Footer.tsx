import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Mail from 'lucide-react-native/dist/esm/icons/mail';
import Heart from 'lucide-react-native/dist/esm/icons/heart';
import Github from 'lucide-react-native/dist/esm/icons/github';
import Moon from 'lucide-react-native/dist/esm/icons/moon';
import Sun from 'lucide-react-native/dist/esm/icons/sun';

interface FooterProps {
  showThemeToggle?: boolean;
}

const Footer: React.FC<FooterProps> = ({ showThemeToggle = true }) => {
  const { colors, isDark, toggleTheme } = useTheme();
  
  const handleEmailPress = () => {
    Linking.openURL('mailto:support@connectcampus.com');
  };

  const handleGithubPress = () => {
    Linking.openURL('https://github.com/connectcampus');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.footer }]}>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={[styles.copyright, { color: colors.text }]}>
            © {new Date().getFullYear()} ConnectCampus+
          </Text>
          
          {showThemeToggle && (
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.card }]} 
              onPress={toggleTheme}
            >
              {isDark ? (
                <Sun size={18} color={colors.text} />
              ) : (
                <Moon size={18} color={colors.text} />
              )}
            </TouchableOpacity>
          )}
        </View>
        
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.row}>
          <Text style={[styles.tagline, { color: colors.subtext }]}>
            Made with <Heart size={12} color={colors.accent} style={styles.inlineIcon} /> for students
          </Text>
          
          <View style={styles.socialIcons}>
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.card }]} 
              onPress={handleEmailPress}
            >
              <Mail size={18} color={colors.text} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.iconButton, { backgroundColor: colors.card, marginLeft: 8 }]} 
              onPress={handleGithubPress}
            >
              <Github size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  copyright: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagline: {
    fontSize: 12,
    fontWeight: '400',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inlineIcon: {
    marginHorizontal: 2,
  },
  socialIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
});

export default Footer;
