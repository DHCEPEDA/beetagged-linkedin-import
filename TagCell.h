//
//  TagCell.h
//  Bees Chest
//
//  Created by Chris O'Neil on 1/5/14.
//  Copyright (c) 2014 Arbrr. All rights reserved.
//

#import <UIKit/UIKit.h>

@protocol TagCellDelegate <NSObject>
- (void)didPressCellAtItemIndex:(NSInteger)itemIndex;
@end

@interface TagCell : UICollectionViewCell <UIGestureRecognizerDelegate>
@property (nonatomic, assign) NSInteger itemIndex;
@property (nonatomic, weak) id delegate;
@property (nonatomic, strong) UILabel* label;
- (void)addLongPress;
- (void)turnOnDelete;
- (CGSize)getLabelSize;

@end
