//
//  TagActivity.h
//  TagLoading
//
//  Created by Chris O'Neil on 1/25/14.
//  Copyright (c) 2014 Chris O'Neil. All rights reserved.
//

#import <UIKit/UIKit.h>

enum TagActivityLocationType {
    TagActivityTopLeft = 0,
    TagActivityTopRight = 1,
    TagActivityBottomRight = 2,
    TagActivityBottomLeft = 3
};

@interface TagActivity : UIView
@property (nonatomic, assign) NSTimeInterval interval;
@property (nonatomic, strong) UIColor *lightColor;
@property (nonatomic, strong) UIColor *darkColor;

- (void)start;
- (void)end;

@end
