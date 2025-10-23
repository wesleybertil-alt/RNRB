// App.js - Main React Native Rhymebook App
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Vibration,
  Share
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

// Import our complete phonetic engine
import PhoneticEngine from './PhoneticEngine';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Color theme matching Rhymer's Block aesthetic
const colors = {
  background: '#111827',
  surface: '#1F2937',
  surfaceLight: '#374151',
  border: '#4B5563',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  primary: '#8B5CF6',
  secondary: '#EC4899',
  accent: '#06B6D4',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

const RhymebookApp = () => {
  // Main state
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [colorMap, setColorMap] = useState(new Map());
  const [statistics, setStatistics] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // UI state
  const [currentTab, setCurrentTab] = useState('write');
  const [showHighlights, setShowHighlights] = useState(true);
  const [selectedWord, setSelectedWord] = useState(null);
  const [rhymeSuggestions, setRhymeSuggestions] = useState(null);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  
  // Device toggles for all our detection functions
  const [activeDevices, setActiveDevices] = useState({
    rhymes: true,
    alliteration: false,
    assonance: false,
    consonance: false,
    homophones: false,
    wordplay: false,
    metaphors: false,
    repetition: false,
    references: false
  });
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Auto-analyze text when it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (text.trim()) {
        analyzeCurrentText();
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timer);
  }, [text, activeDevices]);
  
  // Analyze text using our complete phonetic engine
  const analyzeCurrentText = useCallback(async () => {
    if (!text.trim()) return;
    
    setIsAnalyzing(true);
    
    try {
      // Use our master analysis function
      const results = PhoneticEngine.analyzeText(text);
      
      setAnalysis(results.analysis);
      setColorMap(results.colorMap);
      setStatistics(results.statistics);
      
      // Pulse animation for new analysis
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true
        })
      ]).start();
      
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, pulseAnim]);
  
  // Get rhyme suggestions for selected word
  const getRhymeSuggestionsForWord = useCallback(async (word) => {
    if (!word || !analysis) return;
    
    const phonetic = PhoneticEngine.getPhonetic(word);
    const ending = PhoneticEngine.getPhoneticEnding(phonetic);
    
    const suggestions = {
      perfect: [],
      slant: [],
      near: [],
      phonetic: phonetic
    };
    
    // Find perfect rhymes from our analysis
    analysis.rhymes.perfect.forEach(group => {
      if (group.words.includes(word.toLowerCase())) {
        suggestions.perfect = group.words.filter(w => w !== word.toLowerCase());
      }
    });
    
    // Find slant rhymes
    analysis.rhymes.slant.forEach(pair => {
      if (pair.words.includes(word.toLowerCase())) {
        suggestions.slant = pair.words.filter(w => w !== word.toLowerCase());
      }
    });
    
    // Add some default suggestions if none found
    if (suggestions.perfect.length === 0) {
      // This would connect to a rhyme dictionary API in production
      suggestions.perfect = ['Loading...'];
    }
    
    setRhymeSuggestions(suggestions);
  }, [analysis]);
  
  // Handle word selection
  const handleWordPress = useCallback((word) => {
    setSelectedWord(word);
    getRhymeSuggestionsForWord(word);
    openBottomSheet();
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    } else {
      Vibration.vibrate(10);
    }
  }, [getRhymeSuggestionsForWord]);
  
  // Bottom sheet animations
  const openBottomSheet = () => {
    setBottomSheetVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true
      })
    ]).start();
  };
  
  const closeBottomSheet = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      setBottomSheetVisible(false);
      setSelectedWord(null);
      setRhymeSuggestions(null);
    });
  };
  
  // Save verse to storage
  const saveVerse = async () => {
    try {
      const verses = await AsyncStorage.getItem('verses') || '[]';
      const parsedVerses = JSON.parse(verses);
      
      const newVerse = {
        id: Date.now().toString(),
        text,
        statistics,
        analysis: {
          rhymes: analysis?.rhymes?.perfect?.length || 0,
          devices: Object.values(activeDevices).filter(v => v).length
        },
        createdAt: new Date().toISOString()
      };
      
      parsedVerses.push(newVerse);
      await AsyncStorage.setItem('verses', JSON.stringify(parsedVerses));
      
      Alert.alert('Saved!', 'Your verse has been saved to your library');
    } catch (error) {
      Alert.alert('Error', 'Could not save verse');
    }
  };
  
  // Share verse
  const shareVerse = async () => {
    try {
      const result = await Share.share({
        message: `Check out my verse:\n\n${text}\n\nRhyme Density: ${statistics?.rhymes?.density || 0}%\nFlow Score: ${statistics?.flow?.complexity || 0}\n\nCreated with Rhymebook`,
        title: 'My Verse'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };
  
  // Render highlighted text with ALL our detection features
  const renderHighlightedText = () => {
    if (!showHighlights || !text) {
      return (
        <TextInput
          style={styles.textInput}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Start writing your bars..."
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
          autoCapitalize="none"
        />
      );
    }
    
    const words = text.split(/(\s+)/);
    
    return (
      <ScrollView style={styles.textContainer}>
        <Text style={styles.highlightedText}>
          {words.map((word, index) => {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
            
            if (!cleanWord || !word.trim()) {
              return (
                <Text key={index} style={styles.normalWord}>
                  {word}
                </Text>
              );
            }
            
            // Get color from our analysis
            const wordStyle = colorMap.get(cleanWord);
            
            // Check for other devices
            let additionalStyles = {};
            
            if (activeDevices.alliteration && analysis?.alliteration) {
              const hasAlliteration = analysis.alliteration.some(a => 
                a.words.some(w => w.toLowerCase() === cleanWord)
              );
              if (hasAlliteration) {
                additionalStyles.textDecorationLine = 'underline';
                additionalStyles.textDecorationColor = colors.success;
              }
            }
            
            if (activeDevices.assonance && analysis?.assonance) {
              const hasAssonance = analysis.assonance.some(a => 
                a.words.some(w => w.toLowerCase() === cleanWord)
              );
              if (hasAssonance) {
                additionalStyles.borderBottomWidth = 1;
                additionalStyles.borderBottomColor = colors.warning;
              }
            }
            
            if (wordStyle) {
              return (
                <Text
                  key={index}
                  onPress={() => handleWordPress(cleanWord)}
                  style={[
                    styles.highlightedWord,
                    {
                      backgroundColor: wordStyle.color + Math.round(wordStyle.opacity * 255).toString(16),
                      borderBottomColor: wordStyle.color,
                      borderBottomWidth: 2,
                      ...additionalStyles
                    }
                  ]}
                >
                  {word}
                </Text>
              );
            }
            
            return (
              <Text
                key={index}
                onPress={() => handleWordPress(cleanWord)}
                style={[styles.normalWord, additionalStyles]}
              >
                {word}
              </Text>
            );
          })}
        </Text>
      </ScrollView>
    );
  };
  
  // Render statistics
  const renderStatistics = () => {
    if (!statistics) return null;
    
    return (
      <View style={styles.statsContainer}>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.totalWords}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{statistics.totalLines}</Text>
            <Text style={styles.statLabel}>Lines</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {statistics.rhymes.density}%
            </Text>
            <Text style={styles.statLabel}>Density</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.accent }]}>
              {statistics.flow.complexity}
            </Text>
            <Text style={styles.statLabel}>Flow</Text>
          </View>
        </View>
        
        {isAnalyzing && (
          <View style={styles.analyzingIndicator}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.analyzingText}>Analyzing phonetics...</Text>
          </View>
        )}
      </View>
    );
  };
  
  // Render analysis view with all our detection results
  const renderAnalysisView = () => {
    if (!analysis) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            Write some bars to see analysis
          </Text>
        </View>
      );
    }
    
    return (
      <ScrollView style={styles.analysisContainer}>
        {/* Rhyme Analysis */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>📊 Phonetic Rhyme Analysis</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analysis.rhymes.perfect.length}
              </Text>
              <Text style={styles.metricLabel}>Perfect</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analysis.rhymes.slant.length}
              </Text>
              <Text style={styles.metricLabel}>Slant</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>
                {analysis.rhymes.internal.length}
              </Text>
              <Text style={styles.metricLabel}>Internal</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={[styles.metricValue, { color: colors.success }]}>
                {statistics?.rhymes?.density}%
              </Text>
              <Text style={styles.metricLabel}>Density</Text>
            </View>
          </View>
        </View>
        
        {/* Literary Devices */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>✨ Literary Devices Detected</Text>
          <View style={styles.devicesList}>
            <TouchableOpacity
              style={[styles.deviceChip, activeDevices.alliteration && styles.deviceChipActive]}
              onPress={() => setActiveDevices(prev => ({...prev, alliteration: !prev.alliteration}))}
            >
              <Text style={styles.deviceText}>
                Alliteration ({analysis.alliteration.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deviceChip, activeDevices.assonance && styles.deviceChipActive]}
              onPress={() => setActiveDevices(prev => ({...prev, assonance: !prev.assonance}))}
            >
              <Text style={styles.deviceText}>
                Assonance ({analysis.assonance.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deviceChip, activeDevices.consonance && styles.deviceChipActive]}
              onPress={() => setActiveDevices(prev => ({...prev, consonance: !prev.consonance}))}
            >
              <Text style={styles.deviceText}>
                Consonance ({analysis.consonance.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deviceChip, activeDevices.homophones && styles.deviceChipActive]}
              onPress={() => setActiveDevices(prev => ({...prev, homophones: !prev.homophones}))}
            >
              <Text style={styles.deviceText}>
                Homophones ({analysis.homophones.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deviceChip, activeDevices.wordplay && styles.deviceChipActive]}
              onPress={() => setActiveDevices(prev => ({...prev, wordplay: !prev.wordplay}))}
            >
              <Text style={styles.deviceText}>
                Wordplay ({analysis.wordplay.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.deviceChip, activeDevices.metaphors && styles.deviceChipActive]}
              onPress={() => setActiveDevices(prev => ({...prev, metaphors: !prev.metaphors}))}
            >
              <Text style={styles.deviceText}>
                Metaphors ({analysis.metaphorsSimiles.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Flow Complexity */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>🔥 Flow Complexity</Text>
          <View style={styles.flowMetrics}>
            <View style={styles.flowScoreContainer}>
              <Animated.Text 
                style={[
                  styles.flowScore,
                  { 
                    color: analysis.flowComplexity.score >= 70 ? colors.success :
                           analysis.flowComplexity.score >= 40 ? colors.warning :
                           colors.error,
                    transform: [{ scale: pulseAnim }]
                  }
                ]}
              >
                {analysis.flowComplexity.score}
              </Animated.Text>
              <Text style={styles.flowLevel}>{analysis.flowComplexity.level}</Text>
            </View>
            
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${analysis.flowComplexity.score}%`,
                    backgroundColor: analysis.flowComplexity.score >= 70 ? colors.success :
                                   analysis.flowComplexity.score >= 40 ? colors.warning :
                                   colors.error
                  }
                ]}
              />
            </View>
          </View>
        </View>
        
        {/* Syllable Patterns */}
        <View style={styles.analysisCard}>
          <Text style={styles.cardTitle}>🎵 Syllable Analysis</Text>
          <View style={styles.syllablePatterns}>
            {analysis.syllablePatterns.slice(0, 4).map((pattern, index) => (
              <View key={index} style={styles.syllableLine}>
                <Text style={styles.syllableCount}>
                  Line {index + 1}: {pattern.syllableCount} syllables
                </Text>
                <Text style={styles.stressPattern}>
                  {pattern.stressPattern || 'uSuSuSuS'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Rhymebook</Text>
          <Text style={styles.headerSubtitle}>Phonetic Analysis Engine v2.0</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={saveVerse} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>💾</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={shareVerse} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>📤</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Stats Bar */}
      {currentTab === 'write' && renderStatistics()}
      
      {/* Main Content */}
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {currentTab === 'write' && renderHighlightedText()}
        {currentTab === 'analyze' && renderAnalysisView()}
      </KeyboardAvoidingView>
      
      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'write' && styles.navItemActive]}
          onPress={() => setCurrentTab('write')}
        >
          <Text style={styles.navIcon}>✍️</Text>
          <Text style={[styles.navText, currentTab === 'write' && styles.navTextActive]}>
            Write
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, currentTab === 'analyze' && styles.navItemActive]}
          onPress={() => setCurrentTab('analyze')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text style={[styles.navText, currentTab === 'analyze' && styles.navTextActive]}>
            Analyze
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.navItem}
          onPress={openBottomSheet}
        >
          <Text style={styles.navIcon}>🎤</Text>
          <Text style={styles.navText}>Rhymes</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.navItem, showHighlights && styles.navItemActive]}
          onPress={() => setShowHighlights(!showHighlights)}
        >
          <Text style={styles.navIcon}>👁️</Text>
          <Text style={[styles.navText, showHighlights && styles.navTextActive]}>
            View
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Bottom Sheet for Rhyme Suggestions */}
      <Modal
        transparent
        visible={bottomSheetVisible}
        animationType="none"
        onRequestClose={closeBottomSheet}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeBottomSheet}
        >
          <Animated.View
            style={[styles.modalBackground, { opacity: fadeAnim }]}
          />
        </TouchableOpacity>
        
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.bottomSheetHandle} />
          
          <Text style={styles.bottomSheetTitle}>
            {selectedWord ? `Rhymes for "${selectedWord}"` : 'Rhyme Assistant'}
          </Text>
          
          {selectedWord && (
            <Text style={styles.phoneticDisplay}>
              [{PhoneticEngine.getPhonetic(selectedWord)}]
            </Text>
          )}
          
          <ScrollView style={styles.rhymesList}>
            {rhymeSuggestions && (
              <>
                {/* Perfect Rhymes */}
                <View style={styles.rhymeSection}>
                  <Text style={[styles.rhymeSectionTitle, { color: colors.success }]}>
                    Perfect Rhymes
                  </Text>
                  <View style={styles.rhymeChips}>
                    {rhymeSuggestions.perfect.map((word, i) => (
                      <TouchableOpacity key={i} style={styles.rhymeChip}>
                        <Text style={styles.rhymeChipText}>{word}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {/* Slant Rhymes */}
                <View style={styles.rhymeSection}>
                  <Text style={[styles.rhymeSectionTitle, { color: colors.warning }]}>
                    Slant Rhymes
                  </Text>
                  <View style={styles.rhymeChips}>
                    {rhymeSuggestions.slant.map((word, i) => (
                      <TouchableOpacity key={i} style={styles.rhymeChip}>
                        <Text style={styles.rhymeChipText}>{word}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12
  },
  headerButton: {
    padding: 8
  },
  headerButtonText: {
    fontSize: 20
  },
  content: {
    flex: 1
  },
  textContainer: {
    flex: 1,
    backgroundColor: colors.surface
  },
  textInput: {
    flex: 1,
    padding: 16,
    color: colors.text,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  highlightedText: {
    padding: 16,
    fontSize: 14,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  highlightedWord: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: 2,
    borderRadius: 4
  },
  normalWord: {
    color: colors.text
  },
  statsContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  analyzingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 8
  },
  analyzingText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  analysisContainer: {
    flex: 1,
    backgroundColor: colors.surface
  },
  analysisCard: {
    margin: 12,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  metricItem: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    paddingVertical: 8
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4
  },
  devicesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  deviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 16
  },
  deviceChipActive: {
    backgroundColor: colors.primary + '30',
    borderWidth: 1,
    borderColor: colors.primary
  },
  deviceText: {
    fontSize: 12,
    color: colors.text
  },
  flowMetrics: {
    alignItems: 'center'
  },
  flowScoreContainer: {
    alignItems: 'center',
    marginBottom: 12
  },
  flowScore: {
    fontSize: 48,
    fontWeight: '700'
  },
  flowLevel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  syllablePatterns: {
    gap: 8
  },
  syllableLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4
  },
  syllableCount: {
    fontSize: 12,
    color: colors.text
  },
  stressPattern: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 20 : 0
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8
  },
  navItemActive: {
    backgroundColor: colors.primary + '10'
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4
  },
  navText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  navTextActive: {
    color: colors.primary
  },
  modalOverlay: {
    flex: 1,
    position: 'relative'
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: SCREEN_HEIGHT * 0.7
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4
  },
  phoneticDisplay: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  rhymesList: {
    padding: 16
  },
  rhymeSection: {
    marginBottom: 24
  },
  rhymeSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8
  },
  rhymeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  rhymeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
    borderRadius: 18
  },
  rhymeChipText: {
    color: colors.text,
    fontSize: 14
  }
});

export default RhymebookApp;